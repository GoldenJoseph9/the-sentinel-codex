// Register chapters here.
// Publication control: set this to the highest chapter released to readers.
// Keep at 16 to preserve the current complete-arc behaviour; set to 1 for a
// Chapter One launch, then increase it as later chapters are released.
window.SENTINEL_RELEASE = {
  publishedThrough: 4,
  interimHeading: "THE ARCHIVE REMAINS OPEN.",
  interimMessage: "You have reached the end of the currently available records. The investigation is not complete. Further records will be released in a future update."
};
window.SENTINEL_CHAPTERS = Object.create(null);
window.SENTINEL_MANIFEST = [
  {id:1, title:"The Man Who Never Existed", file:"chapter1.js"},
  {id:2, title:"The Hunter’s Shadow", file:"chapter2.js"},
  {id:3, title:"The Weaver's Lesson", file:"chapter3.js"},
  {id:4, title:"The Man Who Remembered", file:"chapter4.js"},
  {id:5, title:"The Other Side", file:"chapter5.js"},
  {id:6, title:"The People We Trust", file:"chapter6.js"},
  {id:7, title:"The Empty Annex", file:"chapter7.js"},
  {id:8, title:"The Cost of Knowing", file:"chapter8.js"},
  {id:9, title:"The Things We Cannot Save", file:"chapter9.js"},
  {id:10, title:"The Witness", file:"chapter10.js"},
  {id:11, title:"The Child They Kept", file:"chapter11.js"},
  {id:12, title:"The Life Between", file:"chapter12.js"},
  {id:13, title:"The Three Missing Years", file:"chapter13.js"},
  {id:14, title:"The Cost of Escape", file:"chapter14.js"},
  {id:15, title:"The Seventeenth Correction", file:"chapter15.js"},
  {id:16, title:"What Remains", file:"chapter16.js"}
];