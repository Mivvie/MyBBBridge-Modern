# MyBBBridge Modern

A Visual Studio Code extension that makes MyBB theme development more convenient by bringing your forum templates and stylesheets directly into your editor and syncing changes back to your database.

This project is a modernized and actively maintained fork of the original [MyBBBridge](https://github.com/LeMinaw/MyBBBridge) by LeMinaw, with ongoing improvements and updates.

## What is this?

If you develop themes for MyBB forums, this extension bridges the gap between your theme files in the database and your code editor. Instead of editing templates and stylesheets through the MyBB admin panel, you can work with them in VS Code like you would with any other project.

The extension connects directly to your MyBB database, pulls templates and stylesheets, and keeps them synced as you work. When you save changes in the editor, they automatically update in your forum's database.

## Prerequisites

To use this extension, you'll need:

- Visual Studio Code
- A MyBB forum installation with database access
- Database credentials (host, port, username, password)
- [mbbbm.php (download here)](https://github.com/Mivvie/MyBBBridge-Modern/blob/master/mbbbm.php)

## Getting Started

### Installation

Install the extension through the VS Code Extensions marketplace, or build it from source.

### Initial Setup

1. Open a folder in VS Code where you want to work on your MyBB theme
2. Run the command `MyBBBridge Modern: Create "mybbm.json" configuration file`
3. A `.vscode/mbbbm.json` file will be created with default settings
4. Update the configuration with your MyBB database credentials:

```json
{
    "database": {
        "host": "example.com",
        "port": 3306,
        "database": "mybb",
        "prefix": "mybb_",
        "user": "database_user",
        "password": "database_password"
    },
    "mybbVersion": 1839,
    "mybbUrl": "https://example.com",
    "vscnotifications": true
}
```

5. Once configured, the extension will activate automatically

### Important: Adding mbbbm.php to Your Forum

For the cache to reset automatically when you save changes, you need to upload the `mbbbm.php` file included in this repository to your MyBB forum's root directory (the same location where you uploaded MyBB's `/upload/` directory).

Without this file in place, changes will sync to your database but the forum won't immediately pick them up. You'll need to manually go into the admin panel and save your theme after each change to clear the cache.

### Usage

After setup, you can use these commands:

- **Add Theme from Database**: Loads a theme's templates and stylesheets from your MyBB forum into your workspace. Please make sure your template set and theme names are the same!


## Features

- Direct database connection to your MyBB installation
- Pull templates and stylesheets into your editor
- Auto-sync changes back to your forum
- Configuration management through `mbbbm.json`
- Notifications for important actions

## Status

This project is in early development (version 0.1.0). Features are still being added and refined.

## Development

To work on this extension:

1. Clone the repository
2. Install dependencies: `npm install`
3. Compile the TypeScript: `npm run compile`
4. Watch for changes during development: `npm run watch`
5. Run tests: `npm test`

## Contributing

Contributions are welcome! Feel free to open an issue or submit a pull request on [GitHub](https://github.com/Mivvie/MyBBBridge-Modern).
