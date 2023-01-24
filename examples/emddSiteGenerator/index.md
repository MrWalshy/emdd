# Hello world

This is my document!

@template(name="title" args="text lead")
```
<header>
    <h1>@text;</h1>
    <p>@lead;</p>
</header>
```

 @weave(name="title" text="Hello world" lead="Some text");

Followed by some text.

 @weave(name="testing");