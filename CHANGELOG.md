# Changelog

All notable changes to this project will be documented in this file. See
[Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# 1.0.0 (2020-06-08)


### Bug Fixes

* 🐛 broken tests ([b9432c9](https://github.com/ng-apimock/core/commit/b9432c986682c4dac6de6b61d566fae8c3bed1fd))
* fix expect on windows ([92ad651](https://github.com/ng-apimock/core/commit/92ad651864f50ec5f4f221dc042967053dc9ca0a))
* **get-recordings-handler:** fix linting error ([79c660f](https://github.com/ng-apimock/core/commit/79c660f3b17c867569f9cf350750312a6b07fcb4))
* **lint:** fix linting error ([1a231f5](https://github.com/ng-apimock/core/commit/1a231f5bb2f23707dc7b9dd66a45a2288dac91f5))
* **mock:** move delay option to mock ([96685d4](https://github.com/ng-apimock/core/commit/96685d4d962fa8a500d5f7eb597d0c57e951c4b7))
* **mock-request-handler:** only json.stringify response data when the content-type is json ([deeed2d](https://github.com/ng-apimock/core/commit/deeed2d2c56725a9b14ab4009f4ce52fe4724926))
* **mock-request-handler:** surround handle with try catch [#1](https://github.com/ng-apimock/core/issues/1) ([a525ef2](https://github.com/ng-apimock/core/commit/a525ef23fa8e5393cd8a4bead1e3b4a4b3a43d4c))
* **package:** fix linting issues ([9114abe](https://github.com/ng-apimock/core/commit/9114abed612cab740332055c0aab85822ce42ce4))
* **plugin:** downgrade node typings due to optional parameter issue ([07bdfbc](https://github.com/ng-apimock/core/commit/07bdfbce7d8472578e5b812b19798b063afd1e50))
* **plugin:** fix linting issues ([23a74e8](https://github.com/ng-apimock/core/commit/23a74e8a0d5d7aef1b65ecb990775290885f4152))
* **processor:** fix linting error ([fd14fef](https://github.com/ng-apimock/core/commit/fd14fef316a26fa2c346838e4d158b990bf7a2c7))
* **processor:** fix processing delays ([642d229](https://github.com/ng-apimock/core/commit/642d22963a362e199b16c1e12d9c166ba3f5d5bd))
* **processor:** only watch for changes when explicitly asked [#5](https://github.com/ng-apimock/core/issues/5) ([71085a0](https://github.com/ng-apimock/core/commit/71085a0e2a75daa8aef2521cb9ab6584c2aba202))
* **readme:** fix incorrect preset example ([b496807](https://github.com/ng-apimock/core/commit/b496807c0031f41d58edf95a5964bf892f91d67f))
* **readme:** update incorrect mock json example ([d2987b6](https://github.com/ng-apimock/core/commit/d2987b650696e8055b181e744705233b56d341dd))
* **record-handler:** fix parameter fetching from body ([e5787e7](https://github.com/ng-apimock/core/commit/e5787e7c6f8261850daa054ebd7cd92a6d3a6013))
* **specs:** fix failing specs due to quote - doublequote change ([7232a27](https://github.com/ng-apimock/core/commit/7232a27f0fe976f01ec27cde2b63367339619c53))
* **state:** fix body matching state ([#18](https://github.com/ng-apimock/core/issues/18)) ([259bcc5](https://github.com/ng-apimock/core/commit/259bcc51c896cee2522f33d23058ade6f1ec0a42))


### Features

* **converter:** add converter for old mock.json files ([058dd7f](https://github.com/ng-apimock/core/commit/058dd7fd1d67c9460f971a5a8a9a13e3a14c828a))
* **domain:** add initial domain ([f35a436](https://github.com/ng-apimock/core/commit/f35a436791e6e44c4230572a647c99677d250f80))
* **get-presets-handler:** add get presets handler ([46b391e](https://github.com/ng-apimock/core/commit/46b391ea2044cfb58b20e94e72258cb15f73c095))
* **ioc:** add the ioc container and export the module ([eb8f36a](https://github.com/ng-apimock/core/commit/eb8f36a1c195085a5fb5698a661679a484f3fbbc))
* **middleware:** add option to get the identifier from a header instead of a cookie. ([3d80415](https://github.com/ng-apimock/core/commit/3d804157b3c00545c8e0f3cbf24a9c5ef57ca453))
* **middleware:** add the middleware including handlers ([0805c2f](https://github.com/ng-apimock/core/commit/0805c2f2decd6fda908d4731ab74d1fd24f608d8))
* **package:** update dependencies ([e21888b](https://github.com/ng-apimock/core/commit/e21888bdb0661c4c8639c64ceb5d0930c050d582))
* **presets:** add preset interface ([10dd5e4](https://github.com/ng-apimock/core/commit/10dd5e4fbf45bfe3511e910b68a91d0910681e04))
* **processor:** add the processor ([18285d4](https://github.com/ng-apimock/core/commit/18285d4da9f56dc1fc4db88c707319f59003b69a))
* **processor:** add watch mode ([60c77f3](https://github.com/ng-apimock/core/commit/60c77f330b7e3585c349252c63310c34ad46aec9))
* **record-handler:** add record handler ([51c019b](https://github.com/ng-apimock/core/commit/51c019b5c6f2e87f4550a2eb08d40fae7d6d207a))
* **select-preset-handler:** add select preset handler ([38a8b00](https://github.com/ng-apimock/core/commit/38a8b00c3421868a998de905edd48d03f8c34b79))
