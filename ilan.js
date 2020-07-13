const ngApiMock = require('./dist');

ngApiMock.processor.process({
  echo: true,
  src: 'mocks',
  watch: true
});

console.log(ngApiMock.processor.mocksProcessor.state._mocks[0].responses.okResponse.data);