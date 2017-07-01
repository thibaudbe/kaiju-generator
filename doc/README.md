## The why:

If you work as a web developper, I bet you have heard about the `JavaScript fatigue`.
If not, I am kind of happy for you, it means you never been on the edge of quitting your job because you spent two days trying to set up this new project you have been assigned to.

I won't deep dive into the ins and outs of it, there's already more than enough articles online if you want a taste of it, e.g, [How it feels to learn JavaScript in 2016](https://hackernoon.com/how-it-feels-to-learn-javascript-in-2016-d3a717dd577f).

Tired because everytime we were starting a new project, we ended up drowning in the same pool, facing the exact same issues...We decided to create some sort of `starter-kit generator`, something à la `react-create-app` or `angular CLI` (yeah I know, it means you're willing to use `angular`...but that's another story for another day).

Anyway, like explained at the beginning of the article, here at `Zengularity`, we tend to use `Kaiju` to build the UI's, so that's the library we chose for our starter-kit.
On the `back-end` side of things, we use the `Play` framework coupled with `Scala`.

## The how:

To install the generator, open up your favorite terminal and run `npm install -g kaiju-generator`.

Then to generate a new project, all you have to do is run `kaiju /yourPath`, and you are good to go!

For more details, you can go ahead and read the [project's readme](https://github.com/thibaudbe/kaiju-generator).

But what will you end up with after running this command though?

Something really basic, the bare mininimum, a `client/` folder waiting for you.

Still, you have to install all the dependencies now, a little `cd client && yarn` will do.

Before you get your hands dirty, you might wanna run `yarn start` to download all the dependencies and watch your files, so that your app gets compiled everytime you update a file.

```
.
├── client
|   ├── build
|   └── src
└── server
    ├── public
    └── foo
```

The generated bundled files (`app.css` & `app.js`) will be outputed inside `server/public`.

A couple of things before you go :

- Make sure to add those lines inside your `index.html`
  - inside the `head`:
  ```
  <link rel="stylesheet" media="screen" href="@routes.Assets.versioned("app.css")">
  ```
  - inside the `body`
  ```
  <div id="screenLayer"></div>
  ```
  - just before closing the `body`
  ```
  <script src="@routes.Assets.versioned("app.js")" type="text/javascript"></script>
  ```


- Add this route at the end of `conf/root`

```
GET     /$any<.*>                       controllers.HomeController.index(any: String)
```

That's all folks, you can leave in peace now.

_Til the next episode_
