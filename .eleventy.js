function sidenote(md){
  var parseLinkLabel = md.helpers.parseLinkLabel,
      isSpace = md.utils.isSpace;

  function render_footnote_ref (tokens, idx, options, env, slf){
      var id      = tokens[idx].meta.id

      var label = `<label for="sn-${id}" class="margin-toggle sidenote-number"></label>`
      var input = `<input type="checkbox" id="sn-${id}" class="margin-toggle"/>`
      var sidenote = `<span class="sidenote">${tokens}</span>`
      return `${label}${input}`
  }

  function render_sidenote(tokens, idx, options, env, slf){
      var content = tokens[idx].content
      var sidenote = `<span class="sidenote">${ md.renderInline(content) }</span>`
      return sidenote
  }

  md.renderer.rules.footnote_ref          = render_footnote_ref;
  md.renderer.rules.sidenote              = render_sidenote;

  function footnote_inline(state, silent) {
    var labelStart,
        labelEnd,
        footnoteId,
        token,
        tokens,
        max = state.posMax,
        start = state.pos;

    if (start + 2 >= max) { return false; }
    if (state.src.charCodeAt(start) !== 0x5E/* ^ */) { return false; }
    if (state.src.charCodeAt(start + 1) !== 0x5B/* [ */) { return false; }

    labelStart = start + 2;
    labelEnd = parseLinkLabel(state, start + 1);

    // parser failed to find ']', so it's not a valid note
    if (labelEnd < 0) { return false; }

    // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    //
    if (!silent) {
      if (!state.env.footnotes) { state.env.footnotes = {}; }
      if (!state.env.footnotes.list) { state.env.footnotes.list = []; }
      footnoteId = state.env.footnotes.list.length;

      state.md.inline.parse(
        state.src.slice(labelStart, labelEnd),
        state.md,
        state.env,
        tokens = []
      );

      token      = state.push('footnote_ref', '', 0);
      token.meta = { id: footnoteId };

      token      = state.push('sidenote', '', 0);
      token.content = state.src.slice(labelStart, labelEnd)
      token.children = tokens
    }

    state.pos = labelEnd + 1;
    state.posMax = max;
    return true;
  }

  md.inline.ruler.after('image', 'footnote_inline', footnote_inline);
}



module.exports = function(eleventyConfig) {
  eleventyConfig.setTemplateFormats([
    "pug",
    "md",
    "css",
    "woff"
  ])

  let markdownIt = require("markdown-it")
  let markdownItFootnote = require("markdown-it-footnote")
  let md = markdownIt().use(sidenote)

  // md.renderer.rules.footnote_ref = (tokens, idx, options, env, slf) => {
  //   var id      = slf.rules.footnote_anchor_name(tokens, idx, options, env, slf);
  //   var caption = slf.rules.footnote_caption(tokens, idx, options, env, slf);
  //   var refid   = id;
  //
  //   if (tokens[idx].meta.subId > 0) {
  //     refid += ':' + tokens[idx].meta.subId;
  //   }
  //
  //   var label = `<label for="sn-${id}" class="margin-toggle sidenote-number"></label>`
  //   var input = `<input type="checkbox" id="sn-${id}" class="margin-toggle"/>`
  //   var sidenote = `<span class="sidenote">${tokens}</span>`
  //    //return '<sup class="footnote-ref"><a href="#fn' + id + '" id="fnref' + refid + '">' + caption + '</a></sup>';
  //   return `${label}${input}${sidenote}`
  // }


  eleventyConfig.setLibrary("md", md)

  eleventyConfig.addCollection("notices", collection => collection.getFilteredByGlob("notices/*.md"))

  eleventyConfig.addCollection("journal",
    collection => collection.getFilteredByGlob('./journal/*.md'))

  eleventyConfig.addCollection("highlights",
    collection => collection.getFilteredByGlob("highlights/*.md"))

}
