// Import Packages
require('dotenv').config();
const { configurationOpenaAI, openAIApi } = require('openai');
const fs = require('fs');
const convertXml = require('xml-js');
const convertHtml = require('html-to-text').convert;
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const json2csv = require('json-2-csv');

// Set ENV variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARTICLE_POSTS = process.env.ARTICLE_POSTS;
const TARGET_ARTICLE_ID = process.env.TARGET_ARTICLE_ID;
const SCORE_THRESHOLD = process.env.SCORE_THRESHOLD;

// Create OpenAI object
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Create Pinecone Obj
const pinecone = new Pinecone({
    apiKey: PINECONE_API_KEY,
    environment: PINECONE_ENVIRONMENT,
  });


async function run() {
    try {
        // Get XML file
        let articlesXml = await fs.readFileSync(ARTICLE_POSTS, 'utf8');

        // Parse XML file to JSON
        let articlesJson = await convertXml.xml2js(articlesXml, {compact: true, spaces: 4, ignoreComment: true})

        // Map Reduce (HTMl to Text + Parse Internal Links)
        let formattedArticles = articlesJson.rss.channel.item.map((article) => {
            return { ...article,
                articleText: convertHtml(article['content:encoded']._cdata, {linkBrackets: false, ignoreHref: true})
            };
        });

        // Target a Pinecone index
        const pineconeIndex = pinecone.index(PINECONE_INDEX);

        // OpenAI Vectorize + Push to Pinecone
        for (let article = 0; article < formattedArticles.length; article++) {

            // Create embedding via OpenAI
            let embedding = await openai.embeddings.create({
                model: 'text-embedding-ada-002',
                input: formattedArticles[article].articleText,
                encoding_format: 'float'
            });

            // Adde embedding data to JSON object
            formattedArticles[article].embedding = embedding

        }

        // Chunk the articles
        const chunkedArticles = formattedArticles.reduce((chunkedResults, article, index) => { 

            // Set the chunk size
            const chunkIndex = Math.floor(index/50);
            
            // Start a new chunk
            if(!chunkedResults[chunkIndex]) {
                chunkedResults[chunkIndex] = [];
            }
            
            // Add the article to the chunk
            chunkedResults[chunkIndex].push(article)
            
            return chunkedResults
        }, [])
        
        // Send the chunks to Pinecone
        for (const chunk of chunkedArticles) {

            // Create an empty embeddings array
            let embeddings = [];

            // Push the embeddings of each article to the embeddings
            for (const article of chunk) {
                embeddings.push({
                    id: article['wp:post_id']._text,
                    values: article.embedding.data[0].embedding
                });
            }

            // Push embedding to Pinecone
            await pineconeIndex.upsert(embeddings);

            // Provide confirmation of saving
            console.log(`Pushed ${chunk.length} article embeddings to Pinecone`);
        }

        // Save data to a JSON file
        fs.writeFileSync('./output/article-embeddings.json', JSON.stringify(formattedArticles));

        // Get matched opportunities from Pinecone
        let opps = await pinecone.index(PINECONE_INDEX).query({ topK: 50, id: TARGET_ARTICLE_ID})

        // Get Target Article Info
        let targetArticleInfo = formattedArticles.filter(function(target) {
            return target['wp:post_id']._text === TARGET_ARTICLE_ID
        })

        // Filter
        let filteredOpps = opps.matches.filter(function(opp) {
            // Remove target article & articles below the scoreThreshold
            return opp.id !== TARGET_ARTICLE_ID && opp.score >= 0.7;
        })
        
        // Merge Pinecone Results + WP Data
        let finalOpp = filteredOpps
            // Remove the target article from the opps
            .filter(opp => formattedArticles.some(wp => wp['wp:post_id']._text === opp.id))
            // Add WP link, title and HTML
            .map(finalOpp => ({
                targetUrl: targetArticleInfo[0].link._text,
                ...finalOpp,
                link: formattedArticles.find( wp => wp['wp:post_id']._text === finalOpp.id).link._text,
                title: formattedArticles.find( wp => wp['wp:post_id']._text === finalOpp.id).title._cdata,
                htmlContent: formattedArticles.find( wp => wp['wp:post_id']._text === finalOpp.id)['content:encoded']._cdata
            }))
            // Remove articles already linking to target
            .filter(finalOpp => {
                return !finalOpp.htmlContent.includes(targetArticleInfo[0].link._text)
            })
            // clean up the opps for CSV output
            .filter(finalOpps => {
                delete finalOpps.htmlContent;
                delete finalOpps.values;
                delete finalOpps.sparseValues;
                delete finalOpps.metadata;
                return true;
            });
        
        
        // Save output as CSV
        fs.writeFileSync('./output/opps-'+TARGET_ARTICLE_ID+'.csv', await json2csv.json2csv(finalOpp));
        // Send success message
        console.log(`There were ${finalOpp.length} link opportunities found for the URL ${ targetArticleInfo[0].link._text}`);
    }
    catch (error) {
        console.log(error);
        console.log(JSON.stringify(error))
    }
};

run();