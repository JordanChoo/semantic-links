# Welcome to Semantic Links! 👋 

> :warning: **This is a proof of concept script** and should not be used in a production environment 

Semantic Links uses vector search to identify internal linking opportunities at scale from Wordpress XML export files.

**Want a step by step tutorial breaking down this script? Well [boogie on over here](https://jordanchoo.com/blog/finding-internal-link-opportunities-at-scale-with-vector-search/)💃🕺**

## Tech Stack
Two main platforms are used which are:

- [OpenAI](https://openai.com/) — Creates the vector for each WordPress page using the [embeddings end point](https://platform.openai.com/docs/api-reference/embeddings/create)
- [Pinecone](https://www.pinecone.io/) — Stores all of the page vectors which is then queried for internal linking opportunities based a relevancy threshold

## Environment Variables
- `PINECONE_API_KEY` — The API key for your Pinecone account
- `PINECONE_ENVIRONMENT` — The name of the environment for your Pinecone index
- `PINECONE_INDEX` — The name of the Pinecone Index your vectors are stored in
- `OPENAI_API_KEY` — Your OpenAI API key
- `ARTICLE_POST` — The exported WordPress XML file containing all of the posts and/or pages 
- `TARGET_ARTICLE_ID` — The WordPress ID for the article that you want to find internal links to
- `SCORE_THRESHOLD` — The minimum Pinecone Score threshold that must be met in order to be an internal link opportunity

## Notes on Performance
With the testing that I conducted, I found that accuracy to be the biggest issue here. In that internal linking opportunities with high score thresholds were not topcially relevant while some opportunities that were flagged had higher relevancy.

A few ideas on improving accuracy is potentially:
- Filtering results by meta data
- Vectorizing and searching by page title rather than body content
- Using hybrid search and sparse vectors

If you found this useful or have any thoughts feel free to open an issue or start a discussion in this rep

Enjoy!