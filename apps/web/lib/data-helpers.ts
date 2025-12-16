export function extractBBoxes(data: unknown): number[][] {
  const bboxes: number[][] = [];

  function traverse(obj: unknown) {
    if (!obj || typeof obj !== "object") return;

    // Check if it's an array of 4 numbers (BBox candidate)
    if (Array.isArray(obj)) {
      if (obj.length === 4 && obj.every((x) => typeof x === "number")) {
        // Optimization: Check values are likely coordinates (e.g. 0-1000)
        if (obj.every((x) => x >= 0 && x <= 1000)) {
          bboxes.push(obj as number[]);
        }
      }

      // Continue traversing children even if found (though unlikely to have nested bboxes)
      obj.forEach(traverse);
    } else {
      // It's a non-array object
      Object.values(obj as Record<string, unknown>).forEach(traverse);
    }
  }

  traverse(data);
  return bboxes;
}
