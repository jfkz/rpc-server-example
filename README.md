# Installation

## Pre-requisites

1. Node.js
2. npm

## Steps

1. Install grape and run 2 nodes

```
npm i -g grenache-grape
```

```
grape --dp 20001 --aph 30001 --bn '127.0.0.1:20002'
grape --dp 20002 --aph 40001 --bn '127.0.0.1:20001'
```

2. Clone the repo

```
git clone https://github.com/jfkz/rpc-server-example
```

3. Install dependencies

```
cd rpc-server-example
npm i
```

3. Run 3 clients (in different terminals). They implemented 3 different scenarios:

```
npm run start:client1
npm run start:client2
npm run start:client3
```

4. Enjoy