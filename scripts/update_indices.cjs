const { readFile, writeFile, readdir } = require('node:fs/promises');
const { join } = require('node:path');

const ROOT = process.cwd();

async function updateProjectIndex(project) {
  const filePath = join(ROOT, 'projects', project, 'slides.json');
  const indexPath = join(ROOT, 'projects', project, '_index.json');

  try {
    const content = await readFile(filePath, 'utf-8');
    const lines = content.split('\n');
    const index = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const idMatch = line.match(/^ {4}"id":\s*"([^"]+)"/);
      if (idMatch) {
        const id = idMatch[1];
        let title = '';
        for (let j = 1; j < 15 && (i + j) < lines.length; j++) {
          const nextLine = lines[i + j];
          if (nextLine.match(/^ {2}\},?/) || nextLine.match(/^ {4}"id":/)) break;
          const titleMatch = nextLine.match(/"(heading|title)":\s*"([^"]+)"/);
          if (titleMatch) {
            title = titleMatch[2];
            break;
          }
        }
        index.push({ id, line: i + 1, title });
      }
    }
    await writeFile(indexPath, JSON.stringify(index, null, 2), 'utf-8');
    console.log(`Updated index for ${project}`);
  } catch (err) {
    // console.error(`Skipping ${project}: ${err.message}`);
  }
}

async function main() {
  const projectsDir = join(ROOT, 'projects');
  const entries = await readdir(projectsDir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      await updateProjectIndex(entry.name);
    }
  }
}

main();
