
# i18n Translation Gotchas

This guide helps developers and AI agents handle tricky translation formatting issues in i18n JSON files. It provides actionable regex patterns, clear explanations, and a quick reference for common problems.

## Quick Reference Table

| Gotcha                              | Problem Solved                                 | Find/Replace Section |
|--------------------------------------|------------------------------------------------|---------------------|
| HTML special characters              | Encoded HTML entities in translations          | [HTML Entities](#html-special-characters) |
| Pipeline character (|)               | Missing spaces around pipes                    | [Pipeline Character](#pipeline-character-) |
| Curly braces/colons/asterisks        | Inconsistent spacing in placeholders           | [Curly Braces, Colons, Asterisks](#inconsistent-spacing-around-curly-braces-colons-and-asterisks) |
| Apostrophe spacing                   | Spaces before/after apostrophes and braces     | [Apostrophe Spacing](#space-after-an-apostrophe-and-before-a-brace-or-character) |
| Spaces before periods/commas         | Unwanted spaces before punctuation             | [Spaces Before Periods and Commas](#spaces-before-periods-and-commas) |
| Double spaces                        | Multiple spaces in string values               | [Double Spaces](#double-spaces-within-json-string-values) |
| Leading/trailing spaces              | Spaces at start/end of string values           | [Leading/Trailing Spaces](#leading-spaces-within-json-string-values) |
| Markdown modifier                    | Invalid spacing in @.markdown:{'key'}          | [Markdown Modifier](#markdown-modifier) |
| terms.json exceptions                | Special rules for terms.json                   | [Terms.json](#termsjson) |

## How to Use This Guide

1. Open VS Code and enable "Use Regular Expression" in Find/Replace (.* icon).
2. Copy the relevant Find/Replace patterns from this guide.
3. Run Find/Replace on your translation files. For some patterns (like double spaces), repeat until no matches remain.
4. Review changes before committing.
5. For `terms.json`, always compare with `term-en.json` for canonical formatting.

---

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

```regex
Find:
&[a-zA-Z0-9#]+;
```

Replace manually with the correct character (e.g., &amp; → &).

### Pipeline character (|)

When using the pipeline character `|` in your translations, ensure there are spaces before AND after it to maintain proper formatting.

```regex
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

Often, translation files may have inconsistent spacing around curly braces `{}`, colons `:`, and asterisks `**`. This can lead to formatting issues in the rendered output. Run these patterns after merging translations or before release.

Below is the regex pattern to identify and correct these spacing issues using a find-and-replace approach in your text editor or IDE.

**Add space before `{` inside JSON string values**
_NB: This may need to be run several times to catch all instances._

```regex
Find:
([a-zA-Z0-9)}])\{
Replace:
$1 {
```

> **BSD sed gotcha (macOS):** the more "complete" class `[a-zA-Z0-9\)\]\}]` silently no-ops under BSD sed — `\]` is parsed as closing the character class, so the pattern matches nothing. Stick to `[a-zA-Z0-9)}]` (drop `]` and the backslash escapes). If you ever need `]` in the class, put it first: `[]a-zA-Z0-9)}]`.

**Add space after `}` inside JSON string values**

```regex
Find:
(:\s*".*?)\}(?=[a-zA-Z])
Replace:
$1}
```

### Space after an apostrophe and before a brace or character

Ensure there is no space after an apostrophe `'` and before a brace `{` or character in your translations.

NOTE: Only applies if there is no second apostrophe `'` following the first, targetting "{title} ' and", rather than "{title} 'allOf' dakı",

```regex
Find:
' +([{}])
Replace:
'$1
```

### Space before an apostrophe and after a brace or character

Ensure there is no space before an apostrophe `'` and after a brace `}` or character in your translations.

```regex
Find:
([{}]) +'
Replace:
$1'
```

### Spaces before periods and commas

Ensure there are no spaces before periods `.` and commas `,` in your translations. **Pay particular attention to `} .` and `) .` patterns** — Localazy frequently introduces a stray space after a closing brace or paren (e.g. `Payment of {amount} is due {due_date} .`). A `\w`-based regex misses these; use `\S` instead.

**Find (catches all cases, including after `}` and `)`):**

```regex
": "[^"]*\S +[.,]
```

**Targeted fix for the common Localazy bug:**

```regex
Find:
\} +([.,])
Replace:
}$1
```

**Broader fix (any space-before-punctuation):**

```regex
Find:
 +([.,])
Replace:
$1
```

**Expected false positives** (leave them alone):

* `.{tld}` — leading dot of a TLD placeholder in domain pricing copy.
* ` ...` ellipsis after a word — typographic spacing in some locales.

How to use:

Open Find/Replace in VS Code.
Enable "Use Regular Expression" (.* icon).
Use the regex above for Find and Replace.
Run "Replace All" to clean up spaces before periods and commas.

### Double Spaces within JSON String Values

Sometimes, translation files may inadvertently contain double spaces that can affect the appearance of the text. Run this multiple times until no matches remain.

```regex
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

```regex
Find:
("\s+)([^"]*?")
Replace:
"$2
```

Description:
Removes leading spaces immediately after the opening quote of a JSON value.

### Trailing spaces within JSON string values

Sometimes, translation files may inadvertently contain trailing spaces that can affect the appearance of the text.

```regex
Find:
(:\s*")([^"]*?)( +)(")
Replace:
$1$2$4
```

### Markdown modifier

When using the markdown modifier `@.markdown:{'key'}`, ensure there are no spaces around the colon `:` and that the key is correctly formatted within the curly braces `{}`.

**To find invalid markdown modifiers (with spaces or extra blocks):**

```regex
Find:
@\.markdown\s*(:\s+| +:|:\s*\{\s+'|'[^}]*'\s+\})
```

**To fix and normalize:**

```regex
Find:
@\.markdown\s*:\s*\{\s*'([^'}]+?)'\s*\}
Replace:
@.markdown:{'$1'}
```

**To fix double-blocks like `@.markdown:{': '}{'auth.logged_out'}`:**

```regex
Find:
@\.markdown\s*:\s*\{[^}]*\}\s*\{'([^'}]+)'\}
Replace:
@.markdown:{'$1'}
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

---

## Common Mistakes to Avoid

* Forgetting to enable regex mode in VS Code Find/Replace.
* Not repeating the double-space fix until all are gone.
* Not reviewing changes before committing.
* Editing `terms.json` without comparing to the canonical `term-en.json`.

## Contributing

If you find new translation gotchas or want to improve these patterns, please:

* Add a new section with a clear description, Find/Replace patterns, and examples.
* Update the Quick Reference Table.
* Test your regexes on multiple locales before submitting a PR.

## Training AI Agents for Translation Hygiene

To automate these steps, AI agents should:

* Parse this README and extract all Find/Replace patterns and their descriptions.
* Apply each pattern in order, repeating where noted (e.g., double spaces).
* For `terms.json`, compare output to `term-en.json` and flag differences.
* Report all changes and prompt for review before finalizing.
* Learn from new gotchas added by contributors and update their workflow accordingly.

### Terms.json

This file has a few exceptions to the above rules, especially around braces and spaces. **Always compare to the canonical `term-en.json` in the i18n package for correct formatting.**
