// Import Packages
require('dotenv').config();
const { configurationOpenaAI, openAIApi } = require('openai');
const fs = require('fs');
const convertXml = require('xml-js');
const convertHtml = require('html-to-text').convert;
const { Pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');
const { format } = require('path');

// Set ENV variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_INDEX = process.env.PINECONE_INDEX;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARTICLE_POSTS = process.env.ARTICLE_POSTS;
const TARGET_ARTICLE_ID = '705';
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
    // Get XML file
    let articlesXml = await fs.readFileSync(ARTICLE_POSTS, 'utf8');

    // Parse XML file to JSON
    let articlesJson = await convertXml.xml2js(articlesXml, {compact: true, spaces: 4, ignoreComment: true})

    // Map Reduce (HTMl to Text + Parse Internal Links)
    let formattedJson = articlesJson.rss.channel.item.map((article) => {
        return { ...article,
            articleText: convertHtml(article['content:encoded']._cdata, {linkBrackets: false, ignoreHref: true})
        };
    });

    // // Target a Pinecone index
    // const pineconeIndex = pinecone.index(PINECONE_INDEX);

    // // OpenAI Vectorize + Push to Pinecone
    // for (let article = 0; article < formattedJson.length; article++) {

    //     // Create embedding via OpenAI
    //     let embedding = await openai.embeddings.create({
    //         model: 'text-embedding-ada-002',
    //         input: formattedJson[article].articleText,
    //         encoding_format: 'float'
    //     });

    //     // Adde embedding data to JSON object
    //     formattedJson[article].embedding = embedding

    //     // Push embedding to Pinecone
    //     await pineconeIndex.upsert([{
    //         id: formattedJson[article]['wp:post_id']._text,
    //         values: embedding.data[0].embedding
    //     }]);

    //     // Provide confirmation of saving
    //     console.log(`Post ${formattedJson[article]['wp:post_id']._text} embedding saved to Pinecone`);
    // }

    // // Save data to a JSON file
    // fs.writeFileSync('./output/article-embeddings.json', JSON.stringify(formattedJson));

    // Get matched opportunities from Pinecone
    let opps = await pinecone.index(PINECONE_INDEX).query({ topK: 50, id: '705'})

    // Get Target Article Info
    let targetArticleInfo = formattedJson.filter(function(target) {
        return target['wp:post_id']._text === TARGET_ARTICLE_ID
    })

    // Filter
    let filteredOpps = opps.matches.filter(function(opp) {
        // Remove target article & articles below the scoreThreshold
        return opp.id !== TARGET_ARTICLE_ID && opp.score >= 0.7;
    })
    
    // Merge Pinecone Results + WP Data
    let finalOpp = filteredOpps
        .filter(opp => formattedJson.some(wp => wp['wp:post_id']._text === opp.id))
        .map(finalOpp => ({
            ...finalOpp,
            link: formattedJson.find( wp => wp['wp:post_id']._text === finalOpp.id).link._text,
            title: formattedJson.find( wp => wp['wp:post_id']._text === finalOpp.id).title._cdata
        }));

    // Save output as CSV
        // ID, score, URL, title

    // Send success message
};

run();