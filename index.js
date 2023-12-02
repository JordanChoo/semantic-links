// Import Packages
require('dotenv').config();
const { configurationOpenaAI, openAIApi } = require('openai');
const fs = require('fs');
const convertXml = require('xml-js');
const { convertHtml } = require('html-to-text');
const { pinecone } = require('@pinecone-database/pinecone');

// Set ENV variables
const PINECONE_API_KEY = process.env.PINECONE_API_KEY;
const PINECONE_ENVIRONMENT = process.env.PINECONE_ENVIRONMENT;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const ARTICLE_POSTS = process.env.ARTICLE_POSTS;

// Get XML file

// Parse XML file to JSON

// Map Reduce (HTMl to Text + Parse Internal Links)

// Map Reduce Vectorize

// Upsert Pinecone Project

// Upsert Index Project

// Upsert Pinecone Project

// Upsert Embeddings

// Semantic Search URL

// Remove already linked results

// Output