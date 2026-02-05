import { defineConfig } from 'vite'

export default defineConfig({
  base: '/virtual_office/',  // <-- change to YOUR repo name
})
```

### 3. Create `.gitignore` (new file in root folder)
```
node_modules
dist
.DS_Store