# 🛡️ DOMPurify Usage Guide

## 🎯 **Safe HTML Rendering with DOMPurify**

Your pattern is perfect! Here's how to safely use DOMPurify with `dangerouslySetInnerHTML`:

```tsx
import DOMPurify from "dompurify";

<div
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poll.description) }}
/>;
```

## ✅ **Why This Pattern is Secure**

### **1. 🛡️ DOMPurify Protection**

- **Comprehensive Sanitization**: Removes all dangerous HTML tags and attributes
- **Script Removal**: Eliminates `<script>` tags and their content
- **Event Handler Removal**: Strips `onclick`, `onload`, etc.
- **Protocol Filtering**: Removes `javascript:`, `data:`, `vbscript:` protocols

### **2. 🔒 React's Additional Layer**

- **Automatic Escaping**: React still provides its built-in protection
- **DOM Isolation**: Content is rendered in a controlled environment
- **No Direct Script Execution**: Even if something slips through, React provides additional safety

## 🚀 **Usage Patterns**

### **✅ Basic Usage (Your Pattern)**

```tsx
import DOMPurify from "dompurify"

// Simple sanitization
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poll.description) }} />

// With custom configuration
<div dangerouslySetInnerHTML={{
  __html: DOMPurify.sanitize(poll.description, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'p', 'br'],
    ALLOWED_ATTR: [],
    ALLOW_DATA_ATTR: false,
    ALLOW_UNKNOWN_PROTOCOLS: false
  })
}} />
```

### **✅ Component-Based Usage**

```tsx
import { SafeHtmlRenderer } from "@/components/SafeHtmlRenderer";

// Using pre-built components
<SafeHtmlRenderer
  html={poll.description}
  className="prose"
  fallback={<p>No description available</p>}
/>;
```

### **✅ Hook-Based Usage**

```tsx
import { useDOMPurify } from "@/components/SafeHtmlRenderer";

function MyComponent({ content }: { content: string }) {
  const { sanitize } = useDOMPurify();

  return <div dangerouslySetInnerHTML={{ __html: sanitize(content) }} />;
}
```

## 🎯 **Configuration Options**

### **✅ Strict Configuration (No HTML)**

```tsx
const config = {
  ALLOWED_TAGS: [],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(content, config),
  }}
/>;
```

### **✅ Basic HTML Configuration**

```tsx
const config = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(content, config),
  }}
/>;
```

### **✅ Rich Text Configuration**

```tsx
const config = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
  ],
  ALLOWED_ATTR: ["class", "id"],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(content, config),
  }}
/>;
```

### **✅ With Safe Links Configuration**

```tsx
const config = {
  ALLOWED_TAGS: [
    "b",
    "i",
    "em",
    "strong",
    "p",
    "br",
    "ul",
    "ol",
    "li",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "blockquote",
    "code",
    "pre",
    "a",
  ],
  ALLOWED_ATTR: ["class", "id", "href", "title", "target"],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
};

<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(content, config),
  }}
/>;
```

## 🧪 **Testing Your Implementation**

### **✅ Security Test Cases**

```tsx
const maliciousInputs = [
  '<script>alert("XSS")</script>',
  '<img src="x" onerror="alert(\'XSS\')">',
  "<div onclick=\"alert('XSS')\">Click me</div>",
  'javascript:alert("XSS")',
  "<iframe src=\"javascript:alert('XSS')\"></iframe>",
];

// Test each input
maliciousInputs.forEach((input, index) => {
  const sanitized = DOMPurify.sanitize(input);
  console.log(`Input ${index + 1}:`, input);
  console.log(`Sanitized:`, sanitized);
  // Should not contain any dangerous content
});
```

### **✅ Expected Results**

```tsx
// Input: '<script>alert("XSS")</script>Hello'
// Output: 'Hello'

// Input: '<div onclick="alert(\'XSS\')">Click me</div>'
// Output: '<div>Click me</div>'

// Input: 'javascript:alert("XSS")'
// Output: 'alert("XSS")'
```

## 🎯 **Best Practices**

### **✅ Always Use DOMPurify**

```tsx
// ✅ GOOD - Always sanitize before dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />

// ❌ BAD - Never use dangerouslySetInnerHTML without sanitization
<div dangerouslySetInnerHTML={{ __html: content }} />
```

### **✅ Use Appropriate Configuration**

```tsx
// ✅ GOOD - Configure based on your needs
const config = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
  ALLOWED_ATTR: [],
  ALLOW_DATA_ATTR: false,
  ALLOW_UNKNOWN_PROTOCOLS: false,
};

// ❌ BAD - Too permissive configuration
const badConfig = {
  ALLOWED_TAGS: ["*"],
  ALLOWED_ATTR: ["*"],
  ALLOW_DATA_ATTR: true,
  ALLOW_UNKNOWN_PROTOCOLS: true,
};
```

### **✅ Handle Empty Content**

```tsx
// ✅ GOOD - Handle empty sanitized content
const sanitized = DOMPurify.sanitize(content);
if (!sanitized.trim()) {
  return <p>No content available</p>;
}

return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
```

### **✅ Use Fallbacks**

```tsx
// ✅ GOOD - Provide fallback content
<SafeHtmlRenderer
  html={content}
  fallback={<p>Content could not be displayed</p>}
/>
```

## 🚨 **Common Mistakes to Avoid**

### **❌ Don't Skip Sanitization**

```tsx
// ❌ DANGEROUS - Never do this
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

### **❌ Don't Use Overly Permissive Configs**

```tsx
// ❌ DANGEROUS - Too permissive
const dangerousConfig = {
  ALLOWED_TAGS: ["*"],
  ALLOWED_ATTR: ["*"],
};
```

### **❌ Don't Trust User Input**

```tsx
// ❌ DANGEROUS - Always sanitize user input
const userContent = getUserInput(); // Could be malicious
<div dangerouslySetInnerHTML={{ __html: userContent }} />;
```

## 🎯 **Integration with Your Polling App**

### **✅ Poll Descriptions**

```tsx
// In PollCard component
<CardDescription className="line-clamp-2">
  <SafePollDescription
    description={poll.description}
    fallback={poll.description}
  />
</CardDescription>
```

### **✅ Poll Detail Views**

```tsx
// In PollDetailView component
<CardDescription className="text-base">
  <SafeRichText content={poll.description} fallback={poll.description} />
</CardDescription>
```

### **✅ User-Generated Content**

```tsx
// For any user-generated content
<div
  dangerouslySetInnerHTML={{
    __html: DOMPurify.sanitize(userContent, {
      ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br"],
      ALLOWED_ATTR: [],
      ALLOW_DATA_ATTR: false,
      ALLOW_UNKNOWN_PROTOCOLS: false,
    }),
  }}
/>
```

## 🛡️ **Security Checklist**

- ✅ **Always use DOMPurify** before `dangerouslySetInnerHTML`
- ✅ **Configure appropriately** for your use case
- ✅ **Handle empty content** gracefully
- ✅ **Provide fallbacks** for error cases
- ✅ **Test with malicious inputs** regularly
- ✅ **Keep DOMPurify updated** for latest security patches
- ✅ **Use TypeScript** for type safety
- ✅ **Document your configurations** for team consistency

## 🎉 **Your Implementation is Perfect!**

Your pattern:

```tsx
import DOMPurify from "dompurify";
<div
  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(poll.description) }}
/>;
```

Is exactly the right way to safely render HTML content! It provides:

- ✅ **Comprehensive sanitization** with DOMPurify
- ✅ **Additional safety** with React's built-in protections
- ✅ **Simple and clean** implementation
- ✅ **Industry standard** approach

Keep using this pattern for all HTML content rendering in your polling application! 🛡️
