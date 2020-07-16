---
id: docker
title: Docker
sidebar_label: Docker
---
 
[@ng-apimock/core](https://github.com/ng-apimock/core) is also available as a [docker image](https://hub.docker.com/r/ngapimock/standalone) in combination with [@ng-apimock/dev-interface](https://github.com/ng-apimock/dev-interface).

### Running
You can start the docker container manually

```bash
$ docker run --name my-mock-server -d ngapimock/standalone:latest -p 3000:3000 -v ./mocks:/opt/ngapimock/mocks
```
or through docker-compose

```yaml
version: '3.3'

services:
  ngapimock-standalone:
    image: ngapimock/standalone:latest
    restart: always
    ports:
      - '3000:3000'
    expose:
      - '3000'
    volumes:
      - ./mocks:/opt/ngapimock/mocks   // map your mocks
```

### Urls
- [@ng-apimock/core](https://github.com/ng-apimock/core) is available under http://localhost:3000
- [@ng-apimock/dev-interface](https://github.com/ng-apimock/dev-interface) can be accessed under: http://localhost:3000/dev-interface
