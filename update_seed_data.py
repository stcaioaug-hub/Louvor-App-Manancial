import re

with open('src/lib/seedData.ts', 'r') as f:
    content = f.read()

# Add the default fields to every song
defaults = ", rehearsalStatus: 'not_classified', teamKnowledge: 'not_classified', rehearsalNeed: 'not_classified', attentionLevel: 'normal', technicalLevel: 5, attentionReasons: [], isActiveRepertoire: true"

def replace_song(match):
    song_str = match.group(0)
    
    # insert defaults before closing brace
    # remove trailing brace and add defaults + brace
    
    # special case for Digno de Tudo
    if "title: 'Digno de Tudo'" in song_str:
        song_str = song_str.replace("key: 'C'", "key: 'G'")
        
    # special case for Eu Sou Livre
    if "title: 'Eu Sou Livre'" in song_str:
        song_str = song_str[:-2] + defaults.replace("isActiveRepertoire: true", "isActiveRepertoire: false") + " }"
    else:
        song_str = song_str[:-2] + defaults + " }"
        
    return song_str

content = re.sub(r"\{ id: '[^']+?'.+? \}", replace_song, content)

with open('src/lib/seedData.ts', 'w') as f:
    f.write(content)

