# Reusable Prompt for Updating Google Drive Links

```
You are an expert code-editing assistant working in the loaded Git repo.

Step 1 — Define task variables:
- Set FILE_GLOB := "{{FILE_GLOB}}" (glob pattern for target files, e.g. ui-v*.html).
- Set SHARE_URL_TEMPLATE := "{{SHARE_URL_TEMPLATE}}" (permanent/shareable template, e.g. https://drive.google.com/file/d/${fileId}/view?usp=sharing).

Step 2 — Apply code updates:
- For every file that matches FILE_GLOB, locate the DriveLinkHelper definition and modify the helper that previously returned the temporary uc?id link so that it now returns SHARE_URL_TEMPLATE, interpolating the existing fileId variable. Remove all references to "uc?id" or "&export=view".
- In getDirectImageURL, inside the branch where state.providerType === 'googledrive', replace the hard-coded template with a call to the updated DriveLinkHelper helper so exports use the same permanent/shareable link. Leave logic for other providers unchanged.
- Preserve surrounding formatting and code style.

Step 3 — Review and finalize:
- Show a unified diff for every modified file.
- Run the repository's formatting or test commands if required by the diff (optional when unspecified).
- Stage the changes, create a commit with an informative message, and prepare a pull request summary describing the edits and any testing performed.
```

Replace the brace-wrapped placeholders before sending the prompt to a new session.
