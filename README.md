<div align="center">
    <br />
    <h1>project-updater</h1>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/project-updater"><img src="https://img.shields.io/npm/v/project-updater?color=blue&label=version" alt="version" /></a>
        <a href="https://www.npmjs.com/package/project-updater"><img src="https://img.shields.io/npm/dt/project-updater" alt="downloads" /></a>
    </p>
    <p>
        <a href="https://www.npmjs.com/package/project-updater"><img src="https://nodei.co/npm/project-updater.png?downloads=true&downloadRank=true&stars=true" alt="downloads" /></a>
    </p>
</div>

## About

A simple and easy to use project updater for your Node.js projects. It allows you to update your project without having to manually download and install the new version of the project.

## Installation

**Warning:** `project-updater` is requires node.js version greater than 16!

```bash
npm install project-updater
yarn add project-updater
```

## Usage

Create a host server for your project:

```js
// updater.js (in server side)
import { Server } from "project-updater";
import packageJson from "./project/package.json";

const server = new Server({
    package: packageJson,
    port: 5000,
    key: "your-super-secret-key",
    path: "/my-project/",
});

server.start();
```

Connect to the host server and update your project:

```js
// updater.js (in client side)
import { Client } from "project-updater";

const client = new Client("start", {
    host: "http://localhost:5000",
    auth: { key: "your-super-secret-key" },
    projectDir: "./update-project/",
    reconnectionDelayMax: 5000,
    autoUpdate: true,
    autoConnect: false,
});

client.connect();
```

## Information

This project is still in development and may contain bugs. New features and improvements are planned for the future. If you have any suggestions or found a bug, please create an [issue][issues].

## Help

If you need help, you can ask questions on the [Discord][discord]

[discord]: https://discord.com/users/809325505304068096
[issues]: https://github.com/SeonerVorteX/project-updater/issues
