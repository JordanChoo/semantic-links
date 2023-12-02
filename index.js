// Import Packages
require('dotenv').config();
const { configurationOpenaAI, openAIApi } = require('openai');
const fs = require('fs');
const convertXml = require('xml-js');
const convertHtml = require('html-to-text').convert;
const { pinecone } = require('@pinecone-database/pinecone');
const OpenAI = require('openai');

// Set ENV variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_API_INDEX = process.env.PINECONE_API_INDEX;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARTICLE_POSTS = process.env.ARTICLE_POSTS;

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
            articleText: convertHtml(article['content:encoded']._cdata)
        };
    });

    // Target a Pinecone index
    const pineconeIndex = pinecone.index(PINECONE_INDEX);

    // OpenAI Vectorize + Push to Pinecone
    for (let article = 0; article < formattedJson.length; article++) {
        // Create embedding via OpenAI
        let embedding = await openai.embeddings.create({
            model: 'text-embedding-ada-002',
            input: formattedJson[article].articleText,
            encoding_format: 'float'
        });
        // Push embedding to Pinecone
        await pineconeIndex.upsert({
            id: formattedJson[article]['wp:post_id']._text,
            values: embedding.data[0].embedding
        });

    }

    // Upsert Pinecone Project

    // Upsert Index Project

    // Upsert Pinecone Project

    // Upsert Embeddings

    // Semantic Search URL

    // Remove already linked results

    // Output
}

run();