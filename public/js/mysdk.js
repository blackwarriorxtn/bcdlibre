function format_isbn(strRawValue)
{
  var strValue = strRawValue;

  if (strValue != null)
  {
    // Remove spaces at beginning/end
    strValue = strValue.replace(/^ +/g, "").replace(/ +$/g, "");
    // Remove dashes and spaces - if string is longuer than 13
    if (strValue.length > 13)
    {
      strValue = strValue.replace(/[ -]+/g, "");
    }
    // Hack: some barcode readers mistype numbers/letters on (french) keyboard : fix it
    strValue = strValue.replace(/&/g, "1")
                       .replace(/é/g, "2")
                       .replace(/"/g, "3")
                       .replace(/'/g, "4")
                       .replace(/\(/g, "5")
                       .replace(/-/g, "6")
                       .replace(/è/g, "7")
                       .replace(/_/g, "8")
                       .replace(/ç/g, "9")
                       .replace(/à/g, "0");
  }
  return(strValue);
}
