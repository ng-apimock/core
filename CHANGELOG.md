# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [3.12.0](https://github.com/ng-apimock/core/compare/v3.11.2...v3.12.0) (2024-04-05)


### Features

* add override ipaddres configuration option ([#1070](https://github.com/ng-apimock/core/issues/1070)) ([72b4fd8](https://github.com/ng-apimock/core/commit/72b4fd8c963cbcde7c1edd59114b33ff1224c3be))

## [3.11.2](https://github.com/ng-apimock/core/compare/v3.11.1...v3.11.2) (2023-11-14)


### Bug Fixes

* nested body matching should sort on accuracy ([6584d66](https://github.com/ng-apimock/core/commit/6584d66acde69600ba25b898dc390598f30736da))

## [3.11.1](https://github.com/ng-apimock/core/compare/v3.11.0...v3.11.1) (2023-11-14)


### Bug Fixes

* nested body matching should sort on accuracy ([02bc266](https://github.com/ng-apimock/core/commit/02bc266ef6c28bfb37025a2bf1649398bdff77ca))

# [3.11.0](https://github.com/ng-apimock/core/compare/v3.10.0...v3.11.0) (2023-04-13)


### Features

* add urlencoded and text middleware support ([#1064](https://github.com/ng-apimock/core/issues/1064)) ([75e02bc](https://github.com/ng-apimock/core/commit/75e02bc22d8a5e20af94292074fe94f4ec723d06))

# [3.10.0](https://github.com/ng-apimock/core/compare/v3.8.0...v3.10.0) (2023-03-30)


### Features

* 🎸 support url encoded body ([#1056](https://github.com/ng-apimock/core/issues/1056)) ([0282e7d](https://github.com/ng-apimock/core/commit/0282e7d6c0f4157c8fa71b64531cfad2d985ff5b))

# [3.8.0](https://github.com/ng-apimock/core/compare/v3.7.0...v3.8.0) (2023-03-22)


### Features

* 🎸 add delay per response as override to mock ([b588e5c](https://github.com/ng-apimock/core/commit/b588e5cfd5bea64b3910200eb1b93396429a6a8b)), closes [#246](https://github.com/ng-apimock/core/issues/246)

# [3.7.0](https://github.com/ng-apimock/core/compare/v3.6.1...v3.7.0) (2023-01-25)


### Features

* 🎸 add /state endpoint ([ec1ea98](https://github.com/ng-apimock/core/commit/ec1ea98b6f9272da41ab9c4cb414da167e414e83))

## [3.6.1](https://github.com/ng-apimock/core/compare/v3.6.0...v3.6.1) (2023-01-14)


### Bug Fixes

* 🐛 update dependencies ([#996](https://github.com/ng-apimock/core/issues/996)) ([19f8725](https://github.com/ng-apimock/core/commit/19f8725285c24a583c312e4a1c4b25659a93c28e))

# [3.6.0](https://github.com/ng-apimock/core/compare/v3.5.1...v3.6.0) (2022-12-08)


### Features

* 🎸 update dependencies ([76c9216](https://github.com/ng-apimock/core/commit/76c9216eb669be785f9deb22ad6893924bc40da7))

## [3.5.1](https://github.com/ng-apimock/core/compare/v3.5.0...v3.5.1) (2022-10-05)


### Bug Fixes

* similar mocks resulting in false positives ([#926](https://github.com/ng-apimock/core/issues/926)) ([d9a069c](https://github.com/ng-apimock/core/commit/d9a069c7a7c0ca7be38ddb5616d26c099f1832bd))

# [3.5.0](https://github.com/ng-apimock/core/compare/v3.4.0...v3.5.0) (2022-05-16)


### Features

* variables object interpolation ([#814](https://github.com/ng-apimock/core/issues/814)) ([b8f9398](https://github.com/ng-apimock/core/commit/b8f9398497c4e563c92a542ebd028382dec534be))

# [3.4.0](https://github.com/ng-apimock/core/compare/v3.3.0...v3.4.0) (2021-11-29)


### Features

* add schema definitions ([6ff2de5](https://github.com/ng-apimock/core/commit/6ff2de5fdef8ce16e5bcb8428bdcd21ad5fd77cb)), closes [#646](https://github.com/ng-apimock/core/issues/646) [#643](https://github.com/ng-apimock/core/issues/643) [#640](https://github.com/ng-apimock/core/issues/640) [#639](https://github.com/ng-apimock/core/issues/639) [#638](https://github.com/ng-apimock/core/issues/638) [#636](https://github.com/ng-apimock/core/issues/636) [#635](https://github.com/ng-apimock/core/issues/635) [#633](https://github.com/ng-apimock/core/issues/633) [#647](https://github.com/ng-apimock/core/issues/647)

# [3.3.0](https://github.com/ng-apimock/core/compare/v3.2.0...v3.3.0) (2021-11-09)


### Features

* 🎸 Bump version of node-fetch to 2.6.6 ([#632](https://github.com/ng-apimock/core/issues/632)) ([e6cbcad](https://github.com/ng-apimock/core/commit/e6cbcad8688b6f2df32b221789a7bc51f1ea35ce))

# [3.2.0](https://github.com/ng-apimock/core/compare/v3.1.0...v3.2.0) (2021-10-15)


### Features

* Information endpoint accessible under /ngapimock/info
* Health endpoint accessible under /health, /health/readiness and /health/liveness

### Refactorings

* Presets are now created in under .ngapimock/generated
* Mocks are now created in under .ngapimock/generated

# [3.1.0](https://github.com/ng-apimock/core/compare/v3.0.3...v3.1.0) (2021-09-06)


### Features

* added error-message in case of preset referencing an unknown mock ([#556](https://github.com/ng-apimock/core/issues/556)) ([e205092](https://github.com/ng-apimock/core/commit/e20509282e088567279d6eb8f6988eccb064ceb4))

## [3.0.3](https://github.com/ng-apimock/core/compare/v3.0.2...v3.0.3) (2021-07-27)


### Bug Fixes

* 🐛 add logging in try/catch - mock-request-handler ([8aacc5e](https://github.com/ng-apimock/core/commit/8aacc5ecb24e266e846a22e32f2d494521ae1276)), closes [#421](https://github.com/ng-apimock/core/issues/421)

## [3.0.2](https://github.com/ng-apimock/core/compare/v3.0.1...v3.0.2) (2021-07-21)


### Bug Fixes

* 🐛 add logging in try/catch - mock-request-handler ([#502](https://github.com/ng-apimock/core/issues/502)) ([fd3e09c](https://github.com/ng-apimock/core/commit/fd3e09c41cacc7061361b10cac3b7f4702cc7710)), closes [#421](https://github.com/ng-apimock/core/issues/421)

## [3.0.1](https://github.com/ng-apimock/core/compare/v3.0.0...v3.0.1) (2021-06-02)


### Bug Fixes

* [#452](https://github.com/ng-apimock/core/issues/452) preset with pass through ([#453](https://github.com/ng-apimock/core/issues/453)) ([d160f46](https://github.com/ng-apimock/core/commit/d160f46badfb0f96353c3eb0d155e98f71fb2da7))

# [3.0.0](https://github.com/ng-apimock/core/compare/v2.7.1...v3.0.0) (2021-06-02)


### chore

* 🤖 drop support for Nodejs v10 because EOL ended ([#457](https://github.com/ng-apimock/core/issues/457)) ([8979ee5](https://github.com/ng-apimock/core/commit/8979ee5435a212d5388e52331f74b044e44fb7f2)), closes [#456](https://github.com/ng-apimock/core/issues/456) [#455](https://github.com/ng-apimock/core/issues/455) [#454](https://github.com/ng-apimock/core/issues/454) [#451](https://github.com/ng-apimock/core/issues/451) [#448](https://github.com/ng-apimock/core/issues/448) [#447](https://github.com/ng-apimock/core/issues/447) [#438](https://github.com/ng-apimock/core/issues/438) [#436](https://github.com/ng-apimock/core/issues/436) [#431](https://github.com/ng-apimock/core/issues/431) [#430](https://github.com/ng-apimock/core/issues/430) [#427](https://github.com/ng-apimock/core/issues/427) [#425](https://github.com/ng-apimock/core/issues/425) [#424](https://github.com/ng-apimock/core/issues/424)


### BREAKING CHANGES

* 🧨 NodeJs v10 dropped

## [2.7.1](https://github.com/ng-apimock/core/compare/v2.7.0...v2.7.1) (2021-04-15)


### Bug Fixes

* [#418](https://github.com/ng-apimock/core/issues/418) interpolate binary json responses ([#420](https://github.com/ng-apimock/core/issues/420)) ([bfa5e57](https://github.com/ng-apimock/core/commit/bfa5e576e4c29eee206c07ea7036128aee9f47cb))

# [2.7.0](https://github.com/ng-apimock/core/compare/v2.6.0...v2.7.0) (2021-04-11)


### Features

* add debug logging ([#412](https://github.com/ng-apimock/core/issues/412)) ([180b20c](https://github.com/ng-apimock/core/commit/180b20cd6bd8870c99c1f9e3353fcdae3afa5f89))

# [2.6.0](https://github.com/ng-apimock/core/compare/v2.5.0...v2.6.0) (2021-04-06)


### Features

* **create presets:** add functionality to add presets and mocks to preset ([#393](https://github.com/ng-apimock/core/issues/393)) ([45b8c00](https://github.com/ng-apimock/core/commit/45b8c00e5971c327c3d8f1658e417562907d455e))

# [2.5.0](https://github.com/ng-apimock/core/compare/v2.4.0...v2.5.0) (2021-03-08)


### Features

* **post-mocks:** create mocks handler ([#367](https://github.com/ng-apimock/core/issues/367)) ([e36980d](https://github.com/ng-apimock/core/commit/e36980d5fa246418e575c151f9d3de8f8de38bdb))

# [2.4.0](https://github.com/ng-apimock/core/compare/v2.3.2...v2.4.0) (2020-12-01)


### Features

* Support file watching for patterns other than mocks ([#236](https://github.com/ng-apimock/core/issues/236)) ([#257](https://github.com/ng-apimock/core/issues/257)) ([970eb84](https://github.com/ng-apimock/core/commit/970eb8452c5d6b4d4804c5c54792a539b0ca29a1))

## [2.3.2](https://github.com/ng-apimock/core/compare/v2.3.1...v2.3.2) (2020-07-16)


### Bug Fixes

* 🐛 log no matching mock error while handling then clause ([b83ee87](https://github.com/ng-apimock/core/commit/b83ee876185657979fb00510b7622fc7bad806c9)), closes [#91](https://github.com/ng-apimock/core/issues/91)

## [2.3.1](https://github.com/ng-apimock/core/compare/v2.3.0...v2.3.1) (2020-07-16)


### Bug Fixes

* 🐛 log no matching mock error while handling then clause ([#92](https://github.com/ng-apimock/core/issues/92)) ([3118fd9](https://github.com/ng-apimock/core/commit/3118fd9924ab66dacf697e1f283eaa9e5c875709)), closes [#91](https://github.com/ng-apimock/core/issues/91)

# [2.3.0](https://github.com/ng-apimock/core/compare/v2.2.0...v2.3.0) (2020-07-15)


### Features

* Support JS for defining mocks ([#85](https://github.com/ng-apimock/core/issues/85)) ([68d7904](https://github.com/ng-apimock/core/commit/68d7904bf1943bc59e976617ff00a8b27e5e3a08))

# [2.2.0](https://github.com/ng-apimock/core/compare/v2.1.0...v2.2.0) (2020-07-14)


### Features

* 🎸 implement then clause functionality ([#81](https://github.com/ng-apimock/core/issues/81)) ([8486be7](https://github.com/ng-apimock/core/commit/8486be78ee7e451ff12d701b12379dbd29aaa96d)), closes [#80](https://github.com/ng-apimock/core/issues/80)

# [2.1.0](https://github.com/ng-apimock/core/compare/v2.0.1...v2.1.0) (2020-07-08)


### Features

* 🎸 make endpoints base path configurable ([#78](https://github.com/ng-apimock/core/issues/78)) ([59fdd27](https://github.com/ng-apimock/core/commit/59fdd279f1ac2f657ca9a4f8f57e863ae695d6b7)), closes [#76](https://github.com/ng-apimock/core/issues/76)

## [2.0.1](https://github.com/ng-apimock/core/compare/v2.0.0...v2.0.1) (2020-06-08)


### Bug Fixes

* 🐛 method GET and HEAD should not add a body while recording ([aee7f9d](https://github.com/ng-apimock/core/commit/aee7f9d78bf1365264812bcd04672aa7913a035a)), closes [#31](https://github.com/ng-apimock/core/issues/31)

## [2.0.0](https://github.com/ng-apimock/core/compare/v1.0.25...v2.0.0) (2020-06-08)

### chore
* 🤖 use eslint ([875808c](https://github.com/ng-apimock/core/commit/875808c398))
* 🤖 add ide directory to gitignore ([19648da](https://github.com/ng-apimock/core/commit/19648da83b)) 
* 🤖 exclude dist folder from tests ([8dddbc6](https://github.com/ng-apimock/core/commit/8dddbc643d))
* 🤖 use jest instead of sinon ([f49efcc](https://github.com/ng-apimock/core/commit/f49efcc4ee)) 
* 🤖 add github workflow - ci ([0653146](https://github.com/ng-apimock/core/commit/0653146b59)) 
* 🤖 add commitizen ([832e779](https://github.com/ng-apimock/core/commit/832e779e8d)) 
* 🤖 update project dependencies ([63319b4](https://github.com/ng-apimock/core/commit/63319b49ad)) 
* 🤖 update readme with body-parser limit info ([d2e91dc](https://github.com/ng-apimock/core/commit/d2e91dc3d5)) 
* 🤖 update eslint dependencies ([25b4e91](https://github.com/ng-apimock/core/commit/25b4e91baecb8d89162c0cdbbf0df06b68e3b70b))
    
### ci
* 🎡 release ([64f1c83](https://github.com/ng-apimock/core/commit/64f1c83191)) 
* 🎡 add release workflow ([fb7c325](https://github.com/ng-apimock/core/commit/fb7c3257df)) 
* 🎡 remove circle-ci ([1da7a9a](https://github.com/ng-apimock/core/commit/1da7a9a6e4))
