import sys

# Read index.html to get the header
with open('index.html', 'r', encoding='utf-8') as f:
    index_content = f.read()

# Extract header
start_tag = '<header class="nav-header" id="mainHeader" role="banner">'
end_tag = '</header>'
start_idx = index_content.find(start_tag)
end_idx = index_content.find(end_tag) + len(end_tag)
header_html = index_content[start_idx:end_idx]

# Now read blog.html
with open('blog.html', 'r', encoding='utf-8') as f:
    blog_content = f.read()

# Step 1: Inject header after <body ...>
body_start = blog_content.find('<body')
body_end = blog_content.find('>', body_start) + 1

new_blog = blog_content[:body_end] + '\n' + header_html + '\n' + blog_content[body_end:]

# Step 2: Comment out the sidebar
sidebar_start = new_blog.find('<aside class="sidebar left-sidebar')
sidebar_end = new_blog.find('</aside>') + len('</aside>')

if sidebar_start != -1 and sidebar_end != -1:
    new_blog = new_blog[:sidebar_start] + '<!-- OLD SIDEBAR — DO NOT DELETE\n' + new_blog[sidebar_start:sidebar_end] + '\n-->' + new_blog[sidebar_end:]

# Step 3: Remove lg:flex-row from dashboard-layout
old_layout = '<div class="dashboard-layout max-w-[100vw] overflow-x-hidden flex flex-col lg:flex-row flex-1">'
new_layout = '<div class="dashboard-layout max-w-[100vw] overflow-x-hidden flex flex-col flex-1">'
new_blog = new_blog.replace(old_layout, new_layout)

# Save
with open('blog.html', 'w', encoding='utf-8') as f:
    f.write(new_blog)

print('Updated blog.html successfully')
