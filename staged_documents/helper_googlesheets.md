# Helper::GoogleSheet Class

---

## Get Data By Sheet and optional range

### GetSheetRaw as C(sheetname  as C[, range  as C]) 

Get the raw JSON array of arrays for the sheet and optional range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetSheetRaw("customers")
= [
    [
      "firstname",
      "lastname",
    ],
    [
      "john",
      "public"
    ],
    [
      "sam",
      "spade"
    ]
  ]
```

### GetSheetJson as C(sheetname  as C[, columnNames  as C[, range  as C]])  

Get the JSON array of objects for the sheet and optional range - if column names are not supplied, then the first row of the range is assumed to contain the column names.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetSheetJSON("customers","A2:C2")
= [
    {
        "firstname": "john",
        "lastname": "public"
    },
    {
        "firstname": "sam",
        "lastname": "spade"
    }
]
```

### GetSheetText as C(sheetname  as C[, separator  as C[, range  as C]])

Get range as crlf delimited lines of delimited text defaulting to comma separated if to separator specified.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetSheetText("customers","","") 
firstname,lastname
john,public
sam,spade

```

---

## Get Data By Named Range

### GetNamedRangeRaw as C(namedrange  as C) 

Get Spreadsheet cells using a named range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetNamedRangeRaw("HISCORE")
= [
    [
      400
    ]
  ]

```

### GetNamedRangeJson as C(namedrange  as C[, columnNames  as C])  

Get the JSON array of objects for named range - if column names are not supplied, then the first row of the range is assumed to contain the column names.	

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetNamedRangeJson("HISCORE","score")
= [{"score" : 400}]
```

### GetNamedRangeText as C(namedrange  as C[, separator  as C])  

Get named range as crlf delimited lines of delimited text defaulting to comma separated if to separator specified.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
?  gs.GetNamedRangeText("HISCORE")
= 400
```

---

## Update Sheet Cell Values

### UpdateSheetRaw as L(sheetname  as C,values  as C[, range  as C])

Update a sheet using a raw JSON Array or arrays (at optional range / default to A1 if unspecified)

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.UpdateSheetRaw("customers",<<%JSON%
[
    [
      "jane",
      "doe"
    ]
  ]
%JSON%,"B1:B1")
```

### UpdateSheetJSON as L(sheetname  as C,values  as C[, columnNames  as C[, range  as C]])  

Update a sheet using JSON array of objects, arranged using the supplied columnnames.  If column names are not supplied, then the first record is used to generate the column names.
```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.UpdateSheetRaw("customers",<<%JSON%
[
    {
     "firstname" : "jane",
     "lastname" : "doe"
    }
  ]
%JSON%,"firstname,lastname","B1:B1")
```

### UpdateSheetText as L(sheetname  as C,values  as C[, separator  as C[, range  as C]])  

Update a sheet using a delimited text and an optional range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.UpdateSheetRaw("customers","jane|doe", "|","B1:B1")
```
---
## Update Cells Using a Named Range

### UpdateNamedRangeRaw as L(namedrange  as C,values  as C)  

Update a named ranges contents using a raw JSON Array or arrays (at optional range / default to A1 if unspecified).

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.UpdateNamedRangeRaw("HISCORE","[[350]]")
```

### UpdateNamedRangeJSON as L(namedrange  as C,values  as C[, columnNames  as C])  

Update a named ranges contents using JSON array of objects, arranged using the supplied columnnames.  If column names are not supplied, then the first record is used to generate the column names.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.UpdateNamedRangeJSON("HISCORE","[{score:1000}]")
? gs.UpdateNamedRangeJSON("LEADERBOARD","[{score:1000},{score:800},{score:750}]")

```

### UpdateNamedRangeText as L(namedrange  as C,values  as C[, separator  as C])

Update a named ranges contents using a delimited text and an optional range.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.UpdateNamedRangeText("HISCORE","350")
```

---

## Append Cells into a sheet

### AppendSheetRaw as L(sheetname  as C,values  as C[, range  as C])

Append cells in first available empty space in sheet. Values are specified as JSON array of arrays . Optional range can provide a hint of where to start.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.AppendSheetRaw("customers","[[\"billy\",\"kid\"]]")
```

### AppendSheetJSON as L(sheetname  as C,values  as C[, columnNames  as C[, range  as C]])

Append cells in first available empty space in sheet. Values are specified as JSON array of objects

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.AppendSheetJSON("customers",<<%JSON%
[
   { 
     "firstname":"billy",
     "lastname":"kid" 
   }
]
%JSON%)
```

### AppendSheetText as L(sheetname  as C,values  as C[, separator  as C[, range  as C]])

Append cells in first available empty space in sheet. Values are specified as crlf delimited rows of delimited cells. Separator defines the delimiter, which is assumed to be a comma if ommitted.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.AppendSheetText("customers","billy|kid","|")
```

---

## Managing Named Ranges

### GetNamedRanges as C([ details  as L])

Get Named Ranges defined for SpreadSheet, setitng details to .t. returns the current range associated with the name

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetNamedRanges()
HISCORE
FIELD_HEADINGS
```

Example using the details flag.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.GetNamedRanges(.t.)
HISCORE=scoreboard!B9
FIELD_HEADINGS=Orders!A1:E2
```


### AddNamedRanges as L(ranges  as C)

Define new named ranges.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.AddNamedRanges(<<%str%
LEADERBOARD=scoreboard!A1:A10
PRODUCT_IDS=products!A1:Z1
%str%)
```

### UpdateNamedRanges as L(ranges  as C)

Update existing named range, adding them if they are missing.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.UpdateNamedRanges(<<%str%
LEADERBOARD=scoreboard!B1:B10
%str%)
```


### DeleteNamedRanges as L(ranges  as C)

Delete existing named ranges.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
? gs.DeleteNamedRanges(<<%str%
LEADERBOARD
PRODUCT_IDS
%str%)
```

---

## Managing Spread Sheets

### AddSheet as C(sheetname  as C)

Add a new sheet to a spreadsheet.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.AddSheet("Products")
```

### DeleteSheet as C(sheetname  as C) 

Delete an existing sheet from a spreadsheet.

```xbasic
dim gs as helper::GoogleSheet
gs.namedresource= "<namedresource>"
gs.spreadsheet= "<spreadsheetid>"
gs.DeleteSheet("Products")
```
