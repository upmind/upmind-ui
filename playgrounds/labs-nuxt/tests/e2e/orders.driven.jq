[.. | objects | select(has("specs")) | .specs[]
  | . as $spec | .tests[]
  | select(.projectName == "bdd" and .status == "expected")
  | select($spec.file | test("orders\\.feature"))
  | $spec.title] as $passed
| ($passed | length) == 6
  and ($passed | sort) == ([
    "A signed-in client reads the history",
    "A client moves between pages",
    "Each client column and comparison sets the history criteria",
    "The newest order comes first, and a sort keeps the page",
    "Search and filters live together",
    "The forced category survives each writer"
  ] | sort)
