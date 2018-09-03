# cloudmersive-nlp-api-client

CloudmersiveNlpApiClient - JavaScript client for cloudmersive-nlp-api-client
The powerful Natural Language Processing APIs let you perform part of speech tagging, entity identification, sentence parsing, and much more to help you understand the meaning of unstructured text.
[Cloudmersive NLP API](https://www.cloudmersive.com/nlp-api) provides advanced machine learning-based natural language processing to detect language, sentiment, meaning and intent of text content.

- API version: v1
- Package version: 1.1.2


## Installation

### For [Node.js](https://nodejs.org/)

#### npm

To publish the library as a [npm](https://www.npmjs.com/),
please follow the procedure in ["Publishing npm packages"](https://docs.npmjs.com/getting-started/publishing-npm-packages).

Then install it via:

```shell
npm install cloudmersive-nlp-api-client --save
```

##### Local development

To use the library locally without publishing to a remote npm registry, first install the dependencies by changing 
into the directory containing `package.json` (and this README). Let's call this `JAVASCRIPT_CLIENT_DIR`. Then run:

```shell
npm install
```

Next, [link](https://docs.npmjs.com/cli/link) it globally in npm with the following, also from `JAVASCRIPT_CLIENT_DIR`:

```shell
npm link
```

Finally, switch to the directory you want to use your cloudmersive-nlp-api-client from, and run:

```shell
npm link /path/to/<JAVASCRIPT_CLIENT_DIR>
```

You should now be able to `require('cloudmersive-nlp-api-client')` in javascript files from the directory you ran the last 
command above from.

#### git
#
If the library is hosted at a git repository, e.g.
https://github.com/GIT_USER_ID/GIT_REPO_ID
then install it via:

```shell
    npm install GIT_USER_ID/GIT_REPO_ID --save
```

### For browser

The library also works in the browser environment via npm and [browserify](http://browserify.org/). After following
the above steps with Node.js and installing browserify with `npm install -g browserify`,
perform the following (assuming *main.js* is your entry file, that's to say your javascript file where you actually 
use this library):

```shell
browserify main.js > bundle.js
```

Then include *bundle.js* in the HTML pages.

### Webpack Configuration

Using Webpack you may encounter the following error: "Module not found: Error:
Cannot resolve module", most certainly you should disable AMD loader. Add/merge
the following section to your webpack config:

```javascript
module: {
  rules: [
    {
      parser: {
        amd: false
      }
    }
  ]
}
```

## Getting Started

Please follow the [installation](#installation) instruction and execute the following JS code:

```javascript
var CloudmersiveNlpApiClient = require('cloudmersive-nlp-api-client');

var defaultClient = CloudmersiveNlpApiClient.ApiClient.instance;

// Configure API key authorization: Apikey
var Apikey = defaultClient.authentications['Apikey'];
Apikey.apiKey = "YOUR API KEY"
// Uncomment the following line to set a prefix for the API key, e.g. "Token" (defaults to null)
//Apikey.apiKeyPrefix['Apikey'] = "Token"

var api = new CloudmersiveNlpApiClient.ExtractEntitiesStringApi()

var value = "value_example"; // {String} Input string


var callback = function(error, data, response) {
  if (error) {
    console.error(error);
  } else {
    console.log('API called successfully. Returned data: ' + data);
  }
};
api.extractEntitiesStringPost(value, callback);

```

## Documentation for API Endpoints

All URIs are relative to *https://api.cloudmersive.com*

Class | Method | HTTP request | Description
------------ | ------------- | ------------- | -------------
*CloudmersiveNlpApiClient.ExtractEntitiesStringApi* | [**extractEntitiesStringPost**](docs/ExtractEntitiesStringApi.md#extractEntitiesStringPost) | **POST** /nlp/ExtractEntitiesString | Extract entities from string
*CloudmersiveNlpApiClient.LanguageDetectionApi* | [**languageDetectionPost**](docs/LanguageDetectionApi.md#languageDetectionPost) | **POST** /nlp/language/detect | Detect language of text
*CloudmersiveNlpApiClient.ParseStringApi* | [**parseStringPost**](docs/ParseStringApi.md#parseStringPost) | **POST** /nlp/ParseString | Parse string to syntax tree
*CloudmersiveNlpApiClient.PosTaggerJsonApi* | [**posTaggerJsonPost**](docs/PosTaggerJsonApi.md#posTaggerJsonPost) | **POST** /nlp/PosTaggerJson | Part-of-speech tag a string
*CloudmersiveNlpApiClient.PosTaggerStringApi* | [**posTaggerStringPost**](docs/PosTaggerStringApi.md#posTaggerStringPost) | **POST** /nlp/PosTaggerString | Part-of-speech tag a string
*CloudmersiveNlpApiClient.SentencesApi* | [**sentencesPost**](docs/SentencesApi.md#sentencesPost) | **POST** /nlp/get/sentences/string | Extract sentences from string
*CloudmersiveNlpApiClient.SpellCheckApi* | [**spellCheckCheckJson**](docs/SpellCheckApi.md#spellCheckCheckJson) | **POST** /nlp/spellcheck/check/word/json | Spell check word
*CloudmersiveNlpApiClient.SpellCheckApi* | [**spellCheckCheckSentenceJson**](docs/SpellCheckApi.md#spellCheckCheckSentenceJson) | **POST** /nlp/spellcheck/check/sentence/json | Check if sentence is spelled correctly
*CloudmersiveNlpApiClient.SpellCheckApi* | [**spellCheckCheckSentenceString**](docs/SpellCheckApi.md#spellCheckCheckSentenceString) | **POST** /nlp/spellcheck/check/sentence/string | Spell check a sentence
*CloudmersiveNlpApiClient.SpellCheckApi* | [**spellCheckCorrect**](docs/SpellCheckApi.md#spellCheckCorrect) | **POST** /nlp/spellcheck/correct/word/string | Find spelling corrections
*CloudmersiveNlpApiClient.SpellCheckApi* | [**spellCheckCorrectJson**](docs/SpellCheckApi.md#spellCheckCorrectJson) | **POST** /nlp/spellcheck/correct/word/json | Find spelling corrections
*CloudmersiveNlpApiClient.SpellCheckApi* | [**spellCheckPost**](docs/SpellCheckApi.md#spellCheckPost) | **POST** /nlp/spellcheck/check/word/string | Spell check a word
*CloudmersiveNlpApiClient.WordsApi* | [**wordsAdjectives**](docs/WordsApi.md#wordsAdjectives) | **POST** /nlp/get/words/adjectives/string | Get adjectives in string
*CloudmersiveNlpApiClient.WordsApi* | [**wordsAdverbs**](docs/WordsApi.md#wordsAdverbs) | **POST** /nlp/get/words/adverbs/string | Get adverbs in input string
*CloudmersiveNlpApiClient.WordsApi* | [**wordsGetWordsJson**](docs/WordsApi.md#wordsGetWordsJson) | **POST** /nlp/get/words/json | Get words in input string (JSON)
*CloudmersiveNlpApiClient.WordsApi* | [**wordsGetWordsString**](docs/WordsApi.md#wordsGetWordsString) | **POST** /nlp/get/words/string | Get words from string
*CloudmersiveNlpApiClient.WordsApi* | [**wordsNouns**](docs/WordsApi.md#wordsNouns) | **POST** /nlp/get/words/nouns/string | Get nouns in string
*CloudmersiveNlpApiClient.WordsApi* | [**wordsPost**](docs/WordsApi.md#wordsPost) | **POST** /nlp/get/words/verbs/string | Get the verbs in a string
*CloudmersiveNlpApiClient.WordsApi* | [**wordsPronouns**](docs/WordsApi.md#wordsPronouns) | **POST** /nlp/get/words/pronouns/string | Returns all pronounts in string
*CloudmersiveNlpApiClient.WordsApi* | [**wordsProperNouns**](docs/WordsApi.md#wordsProperNouns) | **POST** /nlp/get/words/properNouns/string | Get proper nouns in a string


## Documentation for Models

 - [CloudmersiveNlpApiClient.CheckJsonResponse](docs/CheckJsonResponse.md)
 - [CloudmersiveNlpApiClient.CheckSentenceJsonResponse](docs/CheckSentenceJsonResponse.md)
 - [CloudmersiveNlpApiClient.CorrectJsonResponse](docs/CorrectJsonResponse.md)
 - [CloudmersiveNlpApiClient.CorrectWordInSentenceJsonResponse](docs/CorrectWordInSentenceJsonResponse.md)
 - [CloudmersiveNlpApiClient.GetWordsJsonResponse](docs/GetWordsJsonResponse.md)
 - [CloudmersiveNlpApiClient.LanguageDetectionResponse](docs/LanguageDetectionResponse.md)
 - [CloudmersiveNlpApiClient.PosRequest](docs/PosRequest.md)
 - [CloudmersiveNlpApiClient.PosResponse](docs/PosResponse.md)
 - [CloudmersiveNlpApiClient.PosSentence](docs/PosSentence.md)
 - [CloudmersiveNlpApiClient.PosTaggedWord](docs/PosTaggedWord.md)
 - [CloudmersiveNlpApiClient.WordPosition](docs/WordPosition.md)


## Documentation for Authorization


### Apikey

- **Type**: API key
- **API key parameter name**: Apikey
- **Location**: HTTP header

