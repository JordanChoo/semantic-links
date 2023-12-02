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
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARTICLE_POSTS = process.env.ARTICLE_POSTS;

// Create OpenAI object
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

async function run() {
    // Get XML file
    let articlesXml = await fs.readFileSync(ARTICLE_POSTS, 'utf8');

    // Parse XML file to JSON
    let articlesJson = await convertXml.xml2js(articlesXml, {compact: true, spaces: 4, ignoreComment: true})

    // Map Reduce (HTMl to Text + Parse Internal Links)
    let formattedJson = articlesJson = articlesJson.rss.channel.item.map((article) => {
        return { ...article,
            articleText: convertHtml(article['content:encoded']._cdata)
        };
    });

    // Map Reduce Vectorize

    // Upsert Pinecone Project

    // Upsert Index Project

    // Upsert Pinecone Project

    // Upsert Embeddings

    // Semantic Search URL

    // Remove already linked results

    // Output
}

run();