const GITHUB_TOKEN = "YOUR_GITHUB_TOKEN"; // Isi dengan token PAT
const REPO = "razzaqinspires/metacognitive-nexus";
const FILE_PATH = "memory.json";

async function updateMemory(newData) {
    if (currentUser.demo) return; // Demo mode tidak menyimpan

    const url = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;
    const response = await fetch(url, {
        headers: { Authorization: `token ${GITHUB_TOKEN}` }
    });
    const fileData = await response.json();
    const sha = fileData.sha;
    const existingData = JSON.parse(atob(fileData.content));
    existingData.leaderboard.push(newData);

    const updatedContent = btoa(JSON.stringify(existingData, null, 2));
    await fetch(url, {
        method: "PUT",
        headers: {
            Authorization: `token ${GITHUB_TOKEN}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            message: "Update leaderboard",
            content: updatedContent,
            sha: sha
        })
    });
}