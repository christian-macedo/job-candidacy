/**
 * The constrained resume/letter grammar, shared by the renderer and the verifier.
 *
 * Kept in one place deliberately: if the checker parsed the file differently from
 * the renderer, it could pass a document that lays out wrong, which is the one
 * failure mode a verifier must not have.
 */


/**
 * Resume grammar -> document model.
 *
 *   # Name                         header
 *   <next line>                    contact line, split on · or |
 *   ## Section                     section
 *   ### Title — Organization       entry
 *   <line under ###>               entry meta: location · dates
 *   - bullet                       bullet
 *   **Label:** a, b, c             labelled row (skills)
 *   anything else                  paragraph
 */
export function parseResume(md) {
  const lines = md
    .replace(/<!--[\s\S]*?-->/g, "") // evidence comments never reach the PDF
    .split(/\r?\n/);

  const doc = { name: "", contact: [], sections: [] };
  let section = null;
  let entry = null;
  let expect = null; // "contact" | "meta"

  const currentBlocks = () => (entry ? entry.blocks : section?.blocks);

  for (const raw of lines) {
    const line = raw.trim();

    if (!line) {
      if (expect === "meta") expect = null; // blank line ends the meta slot
      continue;
    }

    if (line.startsWith("# ")) {
      doc.name = line.slice(2).trim();
      expect = "contact";
      continue;
    }

    if (expect === "contact") {
      doc.contact = line.split(/\s*[·|]\s*/).filter(Boolean);
      expect = null;
      continue;
    }

    if (line.startsWith("## ")) {
      section = { title: line.slice(3).trim(), blocks: [], entries: [] };
      doc.sections.push(section);
      entry = null;
      expect = null;
      continue;
    }

    if (line.startsWith("### ")) {
      if (!section) {
        section = { title: "", blocks: [], entries: [] };
        doc.sections.push(section);
      }
      const heading = line.slice(4).trim();
      // Accepts middot, em dash, en dash or " - " as the title/organization
      // separator. Middot is what we write (em dashes read as AI-generated to
      // recruiters); the rest stay supported so older files still parse.
      const m = heading.split(/\s+[·—–]\s+|\s+-\s+/);
      entry = { title: m[0], org: m.slice(1).join(" · "), meta: "", blocks: [] };
      section.entries.push(entry);
      expect = "meta";
      continue;
    }

    if (expect === "meta") {
      expect = null;
      if (!line.startsWith("-") && !line.startsWith("**")) {
        entry.meta = line;
        continue;
      }
      // fall through: this line is real content, the entry just has no meta
    }

    // Body text with no `##` above it — a cover letter, or a preamble. Open an
    // untitled section rather than dropping the content on the floor.
    if (!section && !entry) {
      section = { title: "", blocks: [], entries: [] };
      doc.sections.push(section);
    }

    const blocks = currentBlocks();
    if (!blocks) continue;

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const text = line.slice(2).trim();
      const last = blocks[blocks.length - 1];
      if (last?.type === "list") last.items.push(text);
      else blocks.push({ type: "list", items: [text] });
      continue;
    }

    const labelled = line.match(/^\*\*([^*]+?):?\*\*:?\s*(.*)$/);
    if (labelled && labelled[2]) {
      blocks.push({ type: "row", label: labelled[1].replace(/:$/, ""), value: labelled[2] });
      continue;
    }

    blocks.push({ type: "para", text: line });
  }

  return doc;
}

