# kaiju-generator

A generator for Kaiju framework


## Generated architecture

```
client
  build
  src
    store
    view
    widget
    util
      style
  typing
  test
```

## Installation

```sh
npm install -g kaiju-generator
```

## Quick Start

The quickest way to get started with kaiju is to use the executable `kaiju` to generate an application as shown below:

Create the app:

```sh
kaiju /myApp && cd /myApp
```

Install dependencies:

```sh
npm install
```

Start your Kaiju app:

```sh
npm start
```

## Command Line Options

This generator can also be further configured with the following command line flags.

    -h, --help           output usage information
    -V, --version        output the version number
    -c, --css <engine>   add stylesheet <engine> support (less|stylus|sass) (defaults to less)
    -f, --force          force on non-empty directory

## Example

Generate your app in a custom path:

```sh
kaiju --css=scss ~/Desktop/myApp
```

### TODO

Add option to generate empty templates in a custom path:
- with or without folder pack
- template with state and route
- template with state without route
- stateless template
- store