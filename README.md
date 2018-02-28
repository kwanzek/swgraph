Clone the repository

```
docker-compose up -d neo4j
docker-compose up -d ingestion-engine
docker-compose up -d data-retrieval
```

Then navigate to `localhost:7474` to browse the nodes loaded into Neo.

TODO:
Load relationships for the entities
Expose GraphQL API for accessing the Neo data

