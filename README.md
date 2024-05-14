<div align="center">
    <br />
    <h1>project-updater</h1>
    <br />
    <p>
        <a href="https://www.npmjs.com/package/project-updater"><img src="https://img.shields.io/npm/v/project-updater?color=blue&label=version" alt="version" /></a>
        <a href="https://www.npmjs.com/package/project-updater"><img src="https://img.shields.io/npm/dt/project-updater" alt="downloads" /></a>
    </p>
    <p>
        <a href="https://www.npmjs.com/package/project-updater"><img src="https://nodei.co/npm/project-updater.png?downloads=true&downloadRank=true&stars=true" alt="information" /></a>
    </p>
</div>

## About

A simple and easy to use project updater for your Node.js projects. Suppose you have a specific project and you offer this project to many of your customers and you prepare projects with different features (but the same codebase) for each customer. In this case, you can use this package to update your project for your customers. You can host your project on a server and update it for your customers with a single command. This package saves you from having to apply the same changes to all your customers' projects whenever you make any changes. You can also ignore specific files to prevent them from being updated.

## Highlights

-   **Simple:** Easy to use and understand.
-   **Secure:** Protect your project with a secret key.
-   **Customizable:** Customize the updater to your needs.
-   **Automatic:** Automatically update your project when a new version is available.
-   **Fast:** Update your project in seconds.
-   **Save Time:** Save time by updating your project with a single command.

## Installation

> **Note:**: This package requires Node.js 16.0.0 or higher.

#### Using npm:

```bash
$ npm install project-updater
```

#### Using yarn:

```bash
$ yarn add project-updater
```

## Usage

This package consists of two parts: the server side and the client side. The server side is used to host your project and update it for your client projects. The client side is used to connect to the host server and update your project.

### Server side

**Project structure:**

```plaintext
root/
├── updater.js
├── package.json
└── your-project-path/
    ├── ...
    └── package.json
```

> **Note:** The `package.json` file in the root directory is the main package file, and the `package.json` file in the `my-project` directory is the project package file and must exist.

<hr>

Create a server to host your project and update it for your client projects:

```js
// updater.js
import { Server } from "project-updater";
import packageJson from "./your-project-path/package.json";

const server = new Server({
    package: packageJson,
    port: 5000,
    key: "your-super-secret-key",
    path: "/your-project-path/",
    ignore: ["node_modules", "package-lock.json"],
});

server.start();
```

<hr>

#### Server configuration options:

| Option   | Type          | Default                                 | Description                                                                                      |
| -------- | ------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------ |
| key      | `string`      | -                                       | The secret key to protect your project.                                                          |
| path     | `string`      | -                                       | The path to your project directory.                                                              |
| port     | `number`      | `8080`                                  | The port to listen on.                                                                           |
| package  | `PackageJson` | -                                       | The project package.json file.                                                                   |
| commands | `string[]`    | `[]`                                    | The commands that will run on the client side after the client updates the project.              |
| packages | `string[]`    | `[]`                                    | The npm packages that will be installed on the client side after the client updates the project. |
| ignore   | `string[]`    | `["node_modules", "package-lock.json"]` | The files and directories that will be ignored when updating the project.                        |

### Client side

**Project structure:**

```plaintext
root/
├── updater.js
├── package.json
└── your-project-path/
```

<hr>

Connect to the host server and update your project:

```js
// updater.js
import { Client } from "project-updater";

const client = new Client("start", {
    host: "http://localhost:5000",
    auth: { key: "your-super-secret-key" },
    projectDir: "./your-project-path/",
    reconnectionDelayMax: 5000,
    autoConnect: false,
});

client.connect();
```

<hr>

#### Client configuration options:

| Option               | Type       | Default                 | Description                                                                                                   |
| -------------------- | ---------- | ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| host                 | `string`   | -                       | The host server URL.                                                                                          |
| auth.key             | `string`   | -                       | The secret key to connect to the host server.                                                                 |
| projectDir           | `string`   | `./project`             | The project directory.                                                                                        |
| autoUpdate           | `boolean`  | `true`                  | Automatically update the project when a new version is available.                                             |
| autoConnect          | `boolean`  | `true`                  | Automatically connect to the host server.                                                                     |
| autoStart            | `boolean`  | `true`                  | Automatically start the project after updating.                                                               |
| autoRestart          | `boolean`  | `true`                  | Automatically restart the project when it crashes.                                                            |
| packageJsonPath      | `string`   | `./package.json`        | The path to the project package.json file.                                                                    |
| reconnectionDelayMax | `number`   | `10000`                 | The maximum reconnection delay between reconnection attempts in milliseconds.                                 |
| reconnectionAttempts | `number`   | `10`                    | The maximum reconnection attempts.                                                                            |
| ignore               | `string[]` | `["package-lock.json"]` | The files that will be ignored when updating the project (Only files can be ignored for now, not directories) |

## Future Plans

-   [ ] Add realtime update function to update the project when the server produces a new version.
-   [ ] Add support for ignoring directories in the client side.

## Information

This project is still in development and may contain bugs. New features and improvements are planned for the future. If you have any suggestions or find a bug, please create an [issue][issues].

## Help

If you need help, you can ask questions to [me][discord] on my [Discord server][server].

[discord]: https://discord.com/channels/users/809325505304068096
[server]: https://discord.gg/WPyTM5hbps
[issues]: https://github.com/SeonerVorteX/project-updater/issues
