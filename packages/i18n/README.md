# i18n translation gotchas

This document outlines some common issues and solutions when working with i18n translation files, particularly focusing on formatting and spacing around special characters.

## Common Issues

### HTML special characters

When using HTML special characters like `&#39;`, `&#96;`, `&amp;`, `&lt;`, and `&gt;`, ensure they are correctly formatted and spaced to avoid rendering issues.

* &quot; for single quote (')
* &#39; for apostrophe (')
* &#96; for backtick (`)
* &amp; for ampersand (&)
* &lt; for less than (<)

To specifically find HTML numeric character references like &#39; in your JSON values in VS Code, use this regex:

```

Find:
&[a-zA-Z0-9#]+;

```

### Pipeline character (|)

When using the pipeline character `|` in your translations, ensure there are spaces before AND after it to maintain proper formatting.

```
Find:
(?<! )\|(?! )|(?<! )\| | \|(?! )

Replace:
 |
```

Description:

This matches one or more spaces immediately before a period or comma and removes them.
How to use:

Open Find/Replace in VS Code.
Enable "Use Regular Expression" (.* icon).
Use the regex above for Find and Replace.
Run "Replace All" to clean up spaces before periods and commas.

### Inconsistent Spacing Around Curly Braces, Colons, and Asterisks

Often, translation files may have inconsistent spacing around curly braces `{}`, colons `:`, and asterisks `**`. This can lead to formatting issues in the rendered output.

Below is the regex pattern to identify and correct these spacing issues using a find-and-replace approach in your text editor or IDE.

Add space before { inside JSON string values
> NB: This may need to be run several times to catch all instances

```
Find:
(:\s*".*?)(?<![ \-'"*/\\|\(])\{

Replace:
$1 {
```

Add space after } inside JSON string values

```
Find:
(:\s*".*?)\}(?![ '"|.,;:!?*/\\\-\)])

Replace:
$1}
```

### Space after an apostrophe and before a brace or character

Ensure there is no space after an apostrophe `'` and before a brace `{` or character in your translations.

```
Find:
' +([{}])

Replace:
'$1

```

### Space before an apostrophe and after a brace or character

Ensure there is no space before an apostrophe `'` and after a brace `}` or character in your translations.

```
Find:
([{}]) +'

Replace:
$1'

```

### Spaces before periods and commas

Ensure there are no spaces before periods `.` and commas `,` in your translations.

```
Find:
 +([.,])

Replace:
$1
```

Description:

This matches one or more spaces immediately before a period or comma and removes them.
How to use:

Open Find/Replace in VS Code.
Enable "Use Regular Expression" (.* icon).
Use the regex above for Find and Replace.
Run "Replace All" to clean up spaces before periods and commas.

### Double Spaces within JSON String Values

Sometimes, translation files may inadvertently contain double spaces that can affect the appearance of the text.

```
Find:
(".*?)( {2,})(.*?")

Replace:
$1 $3
```

Description:
Finds two or more spaces within a JSON string value and replaces them with a single space.
Repeat the replace action until no matches remain (since this only replaces one double-space per string per pass).

### Leading spaces within JSON string values

Sometimes, translation files may inadvertently contain leading spaces that can affect the appearance of the text.

```
Find:
(")\s+([^"]*?")

Replace:
"$2
```

Description:
Removes leading spaces immediately after the opening quote of a JSON value.

### Trailing spaces within JSON string values

Sometimes, translation files may inadvertently contain trailing spaces that can affect the appearance of the text.

```
Find:
(:\s*")([^"]*?)( +)(")

Replace:
$1$2$4

```

### Markdown modifier

When using the markdown modifier `@.markdown:{'key'}`, ensure there are no spaces around the colon `:` and that the key is correctly formatted within the curly braces `{}`.

```
Find:
@.markdown : 

Replace manually
@.markdown:

```

**What to look for:**

* There should be no spaces before or after the colon (`:`) in `@.markdown:{'key'}`.
* The key should be a quoted string inside the curly braces, with no leading or trailing spaces inside the braces.

**Correct examples:**

* `@.markdown:{'key'}`
* `@.markdown:{'another_key'}`

**Incorrect examples:**

* `@.markdown : {'key'}`
* `@.markdown: { 'key' }`
* `@.markdown :{ 'key'}`

**How to fix:**
Use Find/Replace to remove spaces around the colon and inside the curly braces as needed.
