# Monum - backend

## Mongo
Backup from Atlas:
```bash
mongodump --uri "mongodb+srv://monum-main.oiejfnj.mongodb.net" -u restore_user --gzip --archive="$HOME/Downloads/$(date +'%Y_%m_%d').gz"
```
Restore to local:
```bash
mongorestore --drop --uri "mongodb://test:test@localhost" --gzip --archive="$HOME/Downloads/$(date +'%Y_%m_%d').gz"
```