import glob, json
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
