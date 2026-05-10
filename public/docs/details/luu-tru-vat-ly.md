# Chiến lược lưu trữ vật lý với Sandbox Storage OPFS

```text
/opfs/app
  /knowledge
    /raw
      /sources/
      /metadata/
      checksums.json
      versions.json

    /chunks
      /tcp/
        tcp_001.json
      /udp/

    /search
      /index
        hash_00.json
        hash_01.json
        ...
      
      metadata.json
      corpus_stats.json

    /lookup
      id_to_path.json

  /cache
    query_cache.json
    hot_chunks.json

  /config
    pipeline.json
    stopwords.json
    synonyms.json
    bm25.json

  /secrets
    keys.enc
    providers.enc

  /state
    version.json
    build_info.json
    manifest.json
```

### Định dạng lưu trữ cho api key
```json
{
  "openai": [
    "sk-xxx",
    "sk-yyy"
  ],
  "groq": [
    "gsk-aaa",
    "gsk-bbb"
  ]
}
```
- Chỉ yêu cầu 2 trường thông tin gốc api-key và provider
- Cho phép lưu trữ nhiều provider khác nhau, mỗi provider cho phép lưu trữ nhiều key