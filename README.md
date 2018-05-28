# BCScraping

## 目的
ビックカメラから商品の詳細をスクレイピングし、SpreadSheetに保存する。

## 必要なもの
- Node.JS (-> v8.11.2)
- npm

## 準備


* Node.js,NPMのインストール手順

	* nvmのインストール
	
	```
	$ curl -o- https://raw.githubusercontent.com/creationix/nvm/v0.33.3/install.sh | bash
	```
	
	* Node.js最新版のインストール
	
	```
	$ nvm install --lts
	$ nvm alias default lts/*
	```
	
	* Node.jsが入っているかどうかの確認
	
	```
	$ node -v
	$ npm -v
	```
	
* ライブラリのインストール

```
$ npm install
```
## 使い方

* ローカルサーバを立てる

```
$ npm run build
```

* リクエストの例

(http://localhost:8080/execScraping?q=検索したい用語)  
(http://localhost:8080/execScraping?q=検索したい用語&min=10&max=1000)


