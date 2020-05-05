# Interactive Visualization for Information Security Analysis


## Overview
Implementation of interactive visualization graphs for information security analysis in [ADAMANT]((http://adament.q-e.at)). The visualization illustrates security requirements, assets, risks and controls in a graphical approach. A visualization graph represents information about complex domain coherence along with their dependencies. Regardless on complexity, with graph transformation, it is possible to simplify certain criteria with interaction into other graphical layouts back and forth.
The visualization graphs should be able to process given specifications as input and provide different structured depictions for multiple general criteria. The student is expected to implement a client-side rendered solution as an alternative to the currently used server-side one with support for animation, events and individual rendering. The implementation should be created as library and offer a variety of interactive functionality, configuration for layout and connection between nodes. To archive this, a third-party JavaScript library should be used.



### Getting Started

```bash
git clone git@git.uibk.ac.at:csat2206/Bachelorarbeit.git
cd code
npm install
npm run dev
```




### Build the Documentation

```bash
npm run docs
```

This command creates a `docs/index.html` which is the main entry point for the documentation.


### Build the Project

```bash
npm run build:esm
// or
npm run build:umd
```

This command compiles the source code and provides an ESM-based or UMD-based library.


### Execute Integration Tests

```bash
npm run tests
```

This command executes the integration tests.

### Run Live-Demo

```bash
npm run demo
```

This command compiles the source code and opens a demo page.