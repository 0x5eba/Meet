import glob
import json
import string
import random
paths = glob.glob("./views/*")

IP = 'https://sebastienbiollo.com'
PORT = 443
replace = "http://localhost:3001"

for path in paths:
    new_file = []
    with open(path, 'r') as f:
        for i in f.readlines():
            if replace in i:
                i = i.replace(replace, IP + ":" + str(PORT))
            new_file.append(i)

    with open(path, 'w') as f:
        f.writelines(new_file)


new_file = []
with open("./models/common/config/env.config.js", 'r') as f:
    
    for i in f.readlines():
        randomToken = ''.join(random.SystemRandom().choice(
            string.ascii_uppercase + string.ascii_lowercase + string.digits + "!-_+") for _ in range(50))
        if "jwtSecret2" in i:
            i = i.replace(i, '    "jwtSecret2": "' + randomToken + '",\n')
        elif "jwtSecret" in i:
            i = i.replace(i,  '    "jwtSecret": "' + randomToken + '",\n')
        
        new_file.append(i)

with open("./models/common/config/env.config.js", 'w') as f:
    f.writelines(new_file)
