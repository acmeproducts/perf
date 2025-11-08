# Orbital8 Cartridge Builder Guide

## Overview

The Orbital8 Cartridge System allows you to create custom, reusable configurations for your image review workflow. Each cartridge is a complete theme and feature package that can be saved, exported, shared, and imported across different sessions.

## What is a Cartridge?

A cartridge is a JSON-based configuration that defines:
- **Branding**: Custom titles and subtitles
- **Theme**: Visual styling (colors, backgrounds, UI elements)
- **Frame**: Layout mode (baseline or tabbed)
- **Features**: Enabled functionality (grid view, focus mode, export)

---

## Cartridge Structure

Every cartridge follows this structure:

```json
{
  "id": "unique-cartridge-id",
  "name": "Display Name",
  "branding": {
    "mainTitle": "Main Title Text",
    "subTitle": "Subtitle Description"
  },
  "frame": "baseline|tabbed",
  "theme": {
    "accentColor": "#hexcolor",
    "backgroundColor": "#hexcolor",
    "pillStyle": "rounded|square|minimal"
  },
  "features": {
    "showGrid": true|false,
    "showFocusMode": true|false,
    "showExport": true|false
  }
}
```

---

## Configuration Options

### 1. Branding
Customize the application's identity for specific workflows.

**Options:**
- `mainTitle`: Primary header text (20-30 chars recommended)
- `subTitle`: Descriptive subtitle (30-50 chars recommended)

**Examples:**
```json
// Professional
"branding": {
  "mainTitle": "Asset Review System",
  "subTitle": "Professional Quality Control"
}

// Creative
"branding": {
  "mainTitle": "Portfolio Curation",
  "subTitle": "Select Your Best Work"
}

// Medical
"branding": {
  "mainTitle": "Medical Image Review",
  "subTitle": "Clinical Diagnostic Workflow"
}
```

---

### 2. Frame Mode

**Options:**
- `baseline`: Minimalist fullscreen view, no tab navigation
- `tabbed`: Includes navigation tabs for organized workflows

**Use Cases:**
- **Baseline**: Quick sorting, single-purpose workflows, distraction-free review
- **Tabbed**: Multi-stage workflows, professional reviews, complex projects

```json
"frame": "baseline"  // or "tabbed"
```

---

### 3. Theme

#### Accent Color
The primary interactive color used throughout the interface.

**Popular Choices:**
```json
"accentColor": "#f59e0b"  // Amber - Default
"accentColor": "#3b82f6"  // Blue - Professional
"accentColor": "#ec4899"  // Pink - Creative
"accentColor": "#10b981"  // Green - Success/Quick
"accentColor": "#8b5cf6"  // Purple - Educational
"accentColor": "#ef4444"  // Red - E-commerce/Urgent
"accentColor": "#06b6d4"  // Cyan - Medical/Tech
"accentColor": "#14b8a6"  // Teal - Real Estate
"accentColor": "#d946ef"  // Magenta - Fashion
"accentColor": "#fb7185"  // Rose - Social Media
"accentColor": "#64748b"  // Slate - Architecture
"accentColor": "#78716c"  // Stone - Forensic
```

#### Background Color
Dark background gradient base color.

**Common Options:**
```json
"backgroundColor": "#0f0f0f"  // Pure dark - Default
"backgroundColor": "#1a1a1a"  // Soft dark - Photography
"backgroundColor": "#0a0e1a"  // Blue-tinted - Medical
"backgroundColor": "#0a0a0f"  // Cool dark - Architecture
"backgroundColor": "#0a0a0a"  // True black - Forensic
```

#### Pill Style
Controls the visual style of counter elements.

**Options:**
```json
"pillStyle": "rounded"   // Soft, friendly (12px radius)
"pillStyle": "square"    // Professional, technical (4px radius)
"pillStyle": "minimal"   // Ultra-clean (2px radius)
```

**Complete Theme Example:**
```json
"theme": {
  "accentColor": "#3b82f6",
  "backgroundColor": "#0f0f0f",
  "pillStyle": "square"
}
```

---

### 4. Features

Enable or disable major functionality modules.

```json
"features": {
  "showGrid": true,        // Enable grid view modal
  "showFocusMode": true,   // Enable focus mode toggle
  "showExport": true       // Enable export functionality
}
```

**Feature Combinations:**

**Full-Featured (Default):**
```json
"features": {
  "showGrid": true,
  "showFocusMode": true,
  "showExport": true
}
```

**Minimal Quick Sort:**
```json
"features": {
  "showGrid": false,      // Disable for faster workflow
  "showFocusMode": true,
  "showExport": false     // No export needed for quick triage
}
```

**Review-Only:**
```json
"features": {
  "showGrid": true,
  "showFocusMode": true,
  "showExport": false     // Restrict export for reviewers
}
```

---

## Built-in Preset Cartridges

The system includes 12 ready-to-use cartridges:

### 1. **Professional Review**
- **Use Case**: Asset review, quality control, professional workflows
- **Theme**: Blue (#3b82f6), square pills, tabbed frame
- **Features**: Full-featured

### 2. **Creative Portfolio**
- **Use Case**: Portfolio curation, creative selection
- **Theme**: Pink (#ec4899), rounded pills, baseline frame
- **Features**: Full-featured

### 3. **Quick Sort**
- **Use Case**: Fast image triage, rapid sorting
- **Theme**: Green (#10b981), minimal pills, baseline frame
- **Features**: Grid disabled for speed

### 4. **Medical Imaging**
- **Use Case**: Clinical diagnostics, medical image review
- **Theme**: Cyan (#06b6d4), blue-tinted background, square pills
- **Features**: Full-featured with tabbed workflow

### 5. **Photo Selection**
- **Use Case**: Photography studio, client selection and approval
- **Theme**: Amber (#f59e0b), warm background, rounded pills
- **Features**: Full-featured

### 6. **Educational**
- **Use Case**: Learning resources, educational content review
- **Theme**: Purple (#8b5cf6), rounded pills, tabbed frame
- **Features**: Full-featured

### 7. **E-Commerce**
- **Use Case**: Product catalogs, inventory management
- **Theme**: Red (#ef4444), square pills, baseline frame
- **Features**: Full-featured

### 8. **Architecture**
- **Use Case**: Design review, architectural plans and renders
- **Theme**: Slate (#64748b), cool background, square pills
- **Features**: Full-featured with tabbed workflow

### 9. **Social Media**
- **Use Case**: Content planning, social media scheduling
- **Theme**: Rose (#fb7185), rounded pills, baseline frame
- **Features**: Full-featured

### 10. **Forensic Analysis**
- **Use Case**: Evidence management, digital forensics
- **Theme**: Stone (#78716c), true black background, minimal pills
- **Features**: Full-featured with tabbed workflow

### 11. **Fashion Editorial**
- **Use Case**: Lookbooks, fashion campaign selection
- **Theme**: Magenta (#d946ef), rounded pills, baseline frame
- **Features**: Full-featured

### 12. **Real Estate**
- **Use Case**: Property listings, real estate photography
- **Theme**: Teal (#14b8a6), square pills, baseline frame
- **Features**: Full-featured

---

## Creating Custom Cartridges

### Method 1: Manual JSON Creation

Create a JSON file with this structure:

```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "exported": "2024-01-01T00:00:00.000Z",
  "cartridge": {
    "id": "custom-workflow-01",
    "name": "My Custom Workflow",
    "branding": {
      "mainTitle": "Custom Review System",
      "subTitle": "Tailored for My Needs"
    },
    "frame": "baseline",
    "theme": {
      "accentColor": "#f59e0b",
      "backgroundColor": "#0f0f0f",
      "pillStyle": "rounded"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

Save as `my-cartridge.json`

### Method 2: Export and Modify

1. Load a preset cartridge close to your needs
2. Export it via the cartridge menu
3. Edit the exported JSON file
4. Import the modified version

---

## Example Custom Cartridges

### Wedding Photography
```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "cartridge": {
    "id": "wedding-photo",
    "name": "Wedding Photography",
    "branding": {
      "mainTitle": "Wedding Gallery Curation",
      "subTitle": "Select the Perfect Moments"
    },
    "frame": "baseline",
    "theme": {
      "accentColor": "#fbbf24",
      "backgroundColor": "#1a1a1a",
      "pillStyle": "rounded"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

### Security Surveillance
```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "cartridge": {
    "id": "security-review",
    "name": "Security Surveillance",
    "branding": {
      "mainTitle": "Security Camera Review",
      "subTitle": "Incident Analysis & Documentation"
    },
    "frame": "tabbed",
    "theme": {
      "accentColor": "#dc2626",
      "backgroundColor": "#0a0a0a",
      "pillStyle": "square"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

### Scientific Research
```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "cartridge": {
    "id": "research-lab",
    "name": "Research Laboratory",
    "branding": {
      "mainTitle": "Scientific Image Analysis",
      "subTitle": "Laboratory Data Review"
    },
    "frame": "tabbed",
    "theme": {
      "accentColor": "#06b6d4",
      "backgroundColor": "#0a0e1a",
      "pillStyle": "square"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

### Journalism/News
```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "cartridge": {
    "id": "news-editorial",
    "name": "News Editorial",
    "branding": {
      "mainTitle": "Editorial Photo Selection",
      "subTitle": "News & Journalism Workflow"
    },
    "frame": "baseline",
    "theme": {
      "accentColor": "#ef4444",
      "backgroundColor": "#0f0f0f",
      "pillStyle": "minimal"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

### Video Game Development
```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "cartridge": {
    "id": "gamedev-assets",
    "name": "Game Development",
    "branding": {
      "mainTitle": "Asset Review Pipeline",
      "subTitle": "Game Art & Texture Selection"
    },
    "frame": "tabbed",
    "theme": {
      "accentColor": "#a855f7",
      "backgroundColor": "#0f0f0f",
      "pillStyle": "rounded"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

### Event Photography
```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "cartridge": {
    "id": "event-photos",
    "name": "Event Photography",
    "branding": {
      "mainTitle": "Event Coverage Selection",
      "subTitle": "Corporate & Social Events"
    },
    "frame": "baseline",
    "theme": {
      "accentColor": "#10b981",
      "backgroundColor": "#1a1a1a",
      "pillStyle": "rounded"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

---

## Import/Export Guide

### Exporting a Cartridge

1. Click the cartridge name in the footer
2. Find the slot containing your cartridge
3. Click "Export" button
4. File downloads as `orbital8-[name].json`
5. Save to your preferred location

### Importing a Cartridge

1. Click the cartridge name in the footer
2. Find an empty slot (or delete one)
3. Click "Import" button on target slot
4. Select your `.json` file
5. Cartridge loads into the selected slot
6. Switch to it immediately or later

### Sharing Cartridges

Share exported JSON files with team members via:
- Email attachments
- Cloud storage (Dropbox, Drive, OneDrive)
- Version control (Git repositories)
- Internal file servers
- USB drives for offline environments

---

## Best Practices

### Naming Conventions

**Good Names:**
- "Medical Radiology Q1 2024"
- "Client Approval - Smith Wedding"
- "Product Catalog - Winter Collection"
- "Security Review - Building A"

**Avoid:**
- Generic names like "Cartridge 1"
- Special characters that break JSON
- Names longer than 40 characters

### Color Selection

**Choose accent colors based on psychology:**
- **Blue** (#3b82f6): Trust, professionalism, corporate
- **Green** (#10b981): Success, health, environment
- **Red** (#ef4444): Urgency, alerts, e-commerce
- **Purple** (#8b5cf6): Creativity, education, luxury
- **Cyan** (#06b6d4): Medical, technology, precision
- **Amber** (#f59e0b): Energy, warmth, default
- **Pink** (#ec4899): Fashion, beauty, creative
- **Teal** (#14b8a6): Real estate, nature, calm

### Frame Selection

**Use Baseline When:**
- Single-purpose sorting tasks
- Speed is priority
- Distraction-free environment needed
- Mobile/tablet use

**Use Tabbed When:**
- Multi-stage workflows
- Team collaboration
- Complex review processes
- Desktop/large screen use

### Feature Configuration

**Enable All Features When:**
- Professional/commercial use
- Multi-user environments
- Complete workflow needed
- Export requirements exist

**Disable Grid When:**
- Pure speed sorting required
- Linear review preferred
- Touch interface primary
- Memory constraints exist

**Disable Export When:**
- Security concerns
- Reviewer-only access
- Preliminary sorting only
- Draft/temporary workflows

---

## Troubleshooting

### Import Fails
- Verify JSON syntax is valid
- Check file has correct structure
- Ensure all required fields present
- Try opening in text editor to inspect

### Theme Not Applying
- Verify hex colors start with `#`
- Check frame value is `baseline` or `tabbed`
- Confirm pillStyle is valid option
- Reload page after import

### Cartridge Overwrites Settings
- Each slot is independent
- Switching slots changes entire config
- Export current before switching
- Use URL parameter to force slot: `?cartridge=1`

---

## Advanced Tips

### URL Control
Force load specific slot via URL:
```
https://your-app.com?cartridge=3
```

### Backup Strategy
Export all 5 slots regularly:
1. Monthly scheduled exports
2. Before major changes
3. After perfecting setup
4. Store in version control

### Team Workflows
1. Create standard team cartridges
2. Export and share via repository
3. Document which slot for which project
4. Version cartridge files (`v1.json`, `v2.json`)

### Multiple Configurations
Use all 5 slots strategically:
- Slot 1: Personal quick sort
- Slot 2: Client review
- Slot 3: Team collaboration
- Slot 4: Archive/export workflow
- Slot 5: Experimental/testing

---

## Color Palette Reference

### Professional/Corporate
```
#3b82f6 - Blue (Professional)
#64748b - Slate (Architecture)
#06b6d4 - Cyan (Medical/Tech)
#78716c - Stone (Forensic)
```

### Creative/Artistic
```
#ec4899 - Pink (Creative)
#d946ef - Magenta (Fashion)
#8b5cf6 - Purple (Educational)
#a855f7 - Violet (Gaming)
```

### Action/Energy
```
#ef4444 - Red (E-commerce/Urgent)
#f59e0b - Amber (Default/Energy)
#fbbf24 - Yellow (Events/Joy)
#fb7185 - Rose (Social Media)
```

### Nature/Calm
```
#10b981 - Green (Success/Quick)
#14b8a6 - Teal (Real Estate)
#22c55e - Lime (Environment)
#059669 - Emerald (Health)
```

---

## API Reference (Advanced)

### JavaScript Access

```javascript
// Get active cartridge
CartridgeManager.activeCartridge

// Switch to slot
CartridgeManager.switchToSlot(3)

// Export programmatically
CartridgeManager.exportCartridge(1)

// Load all slots
const slots = CartridgeManager.getAllSlots()

// Check if slot is empty
slots.forEach(slot => {
  console.log(`Slot ${slot.slot}: ${slot.isEmpty ? 'Empty' : slot.cartridge.name}`)
})
```

### Custom Integration

```javascript
// Apply custom theme on-the-fly
CartridgeManager.applyTheme({
  accentColor: '#custom',
  backgroundColor: '#custom',
  pillStyle: 'rounded'
})

// Apply custom branding
const titleEl = document.querySelector('.title')
titleEl.textContent = 'Custom Title'
```

---

## Support & Resources

- **Version**: 2.1.0
- **Format**: JSON
- **Max Slots**: 5
- **File Extension**: `.json`
- **MIME Type**: `application/json`

---

## Quick Start Template

Copy and customize this template:

```json
{
  "type": "orbital8-cartridge",
  "version": "2.1.0",
  "exported": "2024-01-01T00:00:00.000Z",
  "cartridge": {
    "id": "CHANGE-ME",
    "name": "CHANGE-ME",
    "branding": {
      "mainTitle": "CHANGE-ME",
      "subTitle": "CHANGE-ME"
    },
    "frame": "baseline",
    "theme": {
      "accentColor": "#f59e0b",
      "backgroundColor": "#0f0f0f",
      "pillStyle": "rounded"
    },
    "features": {
      "showGrid": true,
      "showFocusMode": true,
      "showExport": true
    }
  }
}
```

**Steps:**
1. Copy template
2. Replace all `CHANGE-ME` placeholders
3. Select accent color from palette
4. Choose frame mode
5. Configure features
6. Save as `.json` file
7. Import into Orbital8

---

## Conclusion

The Cartridge System provides unlimited customization while maintaining simplicity. Whether you're a photographer, medical professional, architect, or any visual workflow professional, you can create the perfect interface for your specific needs.

Start with a built-in preset, export it, modify it, and build your ideal workflow configuration. Share cartridges with your team, backup your favorites, and switch between contexts instantly.

Happy sorting!
