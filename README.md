# Heroes API

[![Build Status](https://travis-ci.org/jason2506/heroes-api.svg?branch=master)](https://travis-ci.org/jason2506/heroes-api) [![Coverage Status](https://coveralls.io/repos/github/jason2506/heroes-api/badge.svg?branch=master)](https://coveralls.io/github/jason2506/heroes-api?branch=master)


## 如何執行

在執行之前，需要先在專案根目錄執行以下指令，來安裝執行所必要的 dependencies：

```
$ npm install --only=production
```

接著，便能夠直接啟動 server 了：

```
$ NODE_ENV=production npm start
```

server 預設使用的 port 為 `3000`，也能夠透過環境變數 `$PORT` 來指定：

```
$ NODE_ENV=production PORT=5566 npm start
```

### 附加命令

要執行其它附加命令，必須完整安裝專案所需的 dependencies：

```
$ npm install
```

然後輸入以下指令來執行：

```
$ npm run <command>
```

能執行的命令（`<command>`）如下：

* `docs`：使用 [apidoc](http://apidocjs.com) 生成 API 文件。在開啟 server 之後，能夠在 server 的 `/` 路徑下看到（如：<http://localhost:3000/>）。
* `dev`：使用 [nodemon](https://nodemon.io) 開啟測試用 server。當 server 的程式碼更動時，會自動重啟 server 來重新載入程式。
* `lint`：使用 [eslint](https://eslint.org) 進行 coding style 的檢查。
* `test`：使用 [mocha](https://mochajs.org) 執行專案的單元測試，並使用 [istanbul](https://istanbul.js.org) 計算測試覆蓋率。


## 專案架構

### 檔案結構

```
.
├── .eslintrc.yml
├── .gitignore
├── .travis.yml
├── Procfile
├── README.md
├── app.js
├── bin
│   └── www
├── package-lock.json
├── package.json
├── routes
│   └── heroes.js
├── test
│   ├── heroes.spec.js
│   └── request.spec.js
└── utils
    └── request.js
```

首先是 NodeJS 專案一定會有的專案設定：

* `package.json`：專案名稱、版本、dependencies 等設定。
* `package-lock.json`：詳細列出整個 dependency tree 的相關資訊。

接著是直接跟 server 有關的部分，這裡大體上遵循傳統 express 專案的檔案結構：

* `bin/www`：server 的啟動點，會載入 `app.js` 定義的 express application object（`app`），並啟動一個 HTTP server 來執行它。
* `app.js`：定義一個 express application。這裡註冊了 routers（本專案僅有 `routes/heroes.js`）以及 error handlers（發出 404、500 等錯誤的 response）。
* `routes/heroes.js`：Heroes APIs 的實作。
* `utils/request.js`：以 promise 實作向 data source 發送 http(s) requests，以取回資料的 helper function。
* `test/heroes.spec.js`：Heroes APIs 的測試碼。
* `test/request.spec.js`：`utils/request.js` 的測試碼。

最後是一些 config files：

* `.eslintrc.yml`：設定 eslint 的 coding style rules。
* `.gitignore`：設定不會被 git track 到的檔案。
* `.travis.yml`：設定 Travis CI 的環境與 jobs。
* `Procfile`：設定部屬到 Heroku 後，啟動 server 所需的指令。

### 架構邏輯

程式中核心的部分都在 `routes/heroes.js` 中，所以只針對這裡作解釋。

嚴格來說，只有 `GET /heroes` 與 `GET /heroes/:heroId` 兩個 API。因為附上帳密的版本 URI 相同，因此與沒附上帳密的版本一併處理。

並且，這兩個 API 都由 `heroes.js` 中定義的數個小 function 來實作。而是否將這兩者實作中的 code sequence 獨立成一個 function 的主要依據有二：

* 是否兩個 API 都會用到？
* 是否會創造不必要的 arrow functions？

第二點的情況像是：

```js
request(options, body)
    .then(() => true);
```

`() => true` 實際上並不會用到它的參數以外的值，因此會將它抽出來獨立定義，避免每次執行時都會重複建立新的 arrow function：

```js
const returnTrue = () => true;

request(options, body)
    .then(returnTrue);
```

此外，由於實作都是透過 `request()` 用 `Promise.then()` 跟 `Promise.cache()` 串起來的，想要能讓 function 名稱取得夠好，讓人很容易就可以講出實作。譬如：

```js
router.get('/', (req, res, next) => {
  auth(req)
    .then(fetchHeroes)
    .then((heroes) => res.status(200).json(heroes))
    .catch(next);
});
```

### 測試邏輯

測試上，中心思想是希望達成模組間的獨立測試。也就是說，在 A 模組依賴於 B 模組的情況下，即使 B 模組仍未實作、或者實作有錯誤的情況下，仍能夠針對 A 模組進行測試。

為了達成這個目的，在本專案的測試中用了許多 mocking libraries：nock、sinon 與 proxyquire。這些會在後面提到，這裡不再贅述。


## 開發流程

### 版本控管

#### Commits

commit 時，視 commit 的目的（加功能、重構、調整設定等等）在 commit message 前面會加上適當的 tag。

好處是未來整理 change logs、或者在追蹤過去的修改紀錄時，直接看 commit tags 就能作大致的區分。

這裡採用的 commit tags 參考自 [gitmoji](https://gitmoji.carloscuesta.me)。

#### Branches

大體上遵循 [git flow](http://nvie.com/posts/a-successful-git-branching-model/)，包含以下 branches：

| Branch      | 可以切出 | 可以合併 | 描述 |
|:----------- |:------- |:------ |:----------- |
| `master`    | `develop`, `hotfix/*` | `staging`, `hotfix/*` | 正式發佈出去的版本。 |
| `develop`   | `staging`, `feature/*` | `staging`, `feature/*`, `hotfix/*` | 包含已開發完、但尚未發佈的 features。 |
| `staging` | N/A | `hotfix/*` | 準備發佈的版本。基本上只修 bug、調整設定，不加新功能。 |
| `feature/*` | N/A | `hotfix/*` | 開發中的單一功能。如 `feature/create-heroes`。 |
| `hotfix/*`  | N/A | N/A | 緊急 bug 修正。視情況 merge 到需要的 branch 上。如 `hotfix/injection`。 |

另外補充幾點：

* 由於專案要求的功能比較單一，在這裡並沒有真的開出 `feature/*` branch 再合併，而是直接 commit 在 `develop` branch 上。
* `staging` branch 類似於原本 git flow 的 `release/*` branch。由於 CI 會在 push 到 `staging` branch 時將專案 deploy 到 staging server，因此在這裡改變名稱強調這點。

### CI/CD

主要是透過 [Travis CI](https://travis-ci.org) 整合 GitHub，在每次 push 的時候：

* 使用 `npm run lint` 檢查 coding style。
* 使用 `npm run test` 執行單元測試。
    - 測試通過之後，將 coverage report 上傳至 [Coveralls](https://coveralls.io)。

兩者都通過之後：

* 若是 `staging` branch，則透過 `npm run docs` 產生 API doc，並與程式一同 deploy 到 Heroku 的 [staging app](https://hahow-heroes-api-staging.herokuapp.com)。
* 若是 `master` branch，與前者類似，只不過是 deploy 到 Heroku 的 [production app](https://hahow-heroes-api.herokuapp.com)。


## 第三方套件

### HTTP Server

執行 API service 所使用到的套件。

只有列在這邊的是最終執行 server 所必要的（也就是說，`npm install` 加上 `--only=production` 時，只會安裝這三個套件）：

* [express](http://expressjs.com)：
    - Web Framework。
    - 比較明顯的特徵是，可以將程式邏輯分散在不同的 middleware 中，再使用 `next()` 串連起來（或是自己吃掉，不給後面處理）。
* [morgan](https://github.com/expressjs/morgan)：
    - express 的 logging middleware。
    - 能夠將 express 的 log 印到 console 上、或是寫到檔案中。
* [debug](https://github.com/visionmedia/debug)：
    - 用來印出 debugging messages。
    - 可以透過環境變數 `$DEBUG` 決定要開啟哪些 message。
    - 譬如說 `DEBUG=heroes-api:*` 可以印出跟 `heroes-api` 有關的 message（現在只會印 server 啟動的訊息）。

### Testing

* [mocha](https://mochajs.org)：
    - Test Runner/Framework。
    - 能自動找尋目錄下的測試檔、執行測試、並顯示結果的工具。
    - 提供了 `describe()` 與 `it()` blocks 等來定義 test cases。
* [chai](http://chaijs.com)：
    - 由於 mocha 只提供了 test framework，通常還會搭配其它 assertion library 來使用。
    - 這裡使用 assertion library 即是 chai，它能夠把 assertion 寫得很口語。
* [chai-as-promised](http://chaijs.com/plugins/chai-as-promised/)：
    - chai 的 plugin。
    - 能比較方便地進行像是「某個 promise 會不會 resolve 出某個值」或是「某個 promise 會不會以某個值 reject」這種檢查。
* [chai-http](http://chaijs.com/plugins/chai-http/)：
    - chai 的 plugin。
    - 能夠用以發出 HTTP request 並檢查 response 是否符合預期。
    - 這裡搭配 express，在不手動開啟 server 的情況下對它進行測試。
* [nock](https://github.com/node-nock/nock)：
    - 能夠替換掉真正的 HTTP requests，代之以自己設定的回傳結果。
    - 如此一來，在測試的時候才不會仰賴於真實的 HTTP requests，導致測試結果不穩定（譬如說，網路不穩，導致測試時過時不過）。
    - 如果要故意弄出 request 失敗（根本收不到 response）的情況也很方便。
* [sinon](http://sinonjs.org)：
    - 提供 spies、stubs 與 mocks，用以在測試時替換某些實作的假物件。
    - spy 用以紀錄 function 被呼叫了多少次、以什麼參數呼叫，但不會改變原始 function 的行為。
    - stub 除了 spy 的功能之外，還能夠為它定義行為，並替換原始 function 的實作。
    - mock 除了 stub 的功能之外，還能夠指定對它的預期：會被呼叫多少次？會以什麼參數呼叫？
* [proxyquire](https://github.com/thlorenz/proxyquire)：
    - sinon 雖然在替換實作這點已經很方便了，但無法替換其它 module 透過 `require()` import 進來的東西。
    - proxyquire 基本上就是對 `require()` 跟 `require.cache` 動手腳，以抽換 `require()` 進來的東西。
* [nyc](https://github.com/istanbuljs/nyc)：
    - 在測試的同時，能夠一併計算 test coverage。
* [coveralls](https://github.com/nickmerwin/node-coveralls)：
    - 計算出 test coverage 之後，透過它將 coverage report 傳到 [Coveralls](https://coveralls.io)。

### Other Tools

* [nodemon](https://nodemon.io)：
    - 在 NodeJS 中 `require()` module 之後，會將該 module 放進 cache 中。
    - 若是某個 module 的程式做了修改，已經放進 cache 中的 module 也不會被更新。這時往往就需要將程式關掉重啟。
    - 而 nodemon 就是能監看檔案是否更新，並自動幫你重啟的工具。
* [apidoc](http://apidocjs.com)：
    - 在程式中撰寫符合特定語法的註解，便能夠自動產生 API 文件。
    - 這些註解可以在 [`routes/heroes.js`](routes/heroes.js) 中看到。
* [eslint](https://eslint.org)：
    - 只要預先設定好規則，便能自動地檢查程式是否符合既定的 coding style。
    - 這裡採用的設定請參考 [`.eslintrc.yml`](.eslintrc.yml)。


## 註解的原則

* 如果有文件產生工具的話，基本上 public interface 都會照既定的格式撰寫。
    - 在這裡是使用 apidoc 的格式撰寫 API 的註解。
    - 另外，雖然沒有用來產生文件，其餘 function 的註解是採用 [JSDoc](http://usejsdoc.org) 的格式撰寫的。
* 在 code block 較長或較為複雜，無法一眼看出在做什麼的情況下，也會加上註解說明。
* TODO、workaround、或是需要解釋業務邏輯才能瞭解為什麼要這麼做的部分。


## 困難、問題與解決方法

在撰寫過程中，碰上的最大困難是測試的撰寫。

如同先前提到的，在這個專案中，希望測試能夠達到：即使自己撰寫的模組之間有依賴性，但測試仍然能夠不受這些依賴性影響。但其實這次是第一次嘗試這麼做。因為以往都是先從底層開始測試，再在底層模組正確無誤的前提下，對上層模組進行測試。

首先在寫 routes 測試的時候，就碰上了不知道怎麼抽換掉自己在 `utils/request.js` 實作的 `request()` 的問題。好在後來找到了 proxyquire，在百般嘗試過後終於弄出一個可以使用的版本。

這類對 mocking 的使用不怎麼熟練的問題，常讓開發中斷了許久。在撰寫一部分功能、加測試、調整測試的不斷循環中，才慢慢形成目前的測試碼。
