import glob, json
paths = glob.glob("./views/*")

IP = '67.205.145.243'

for path in paths:
    new_file = []
    with open(path, 'r') as f:
        for i in f.readlines():
            if "localhost:3001" in i:
                i = i.replace("localhost:3001", IP + ":80")
            new_file.append(i)
    
    with open(path, 'w') as f:
        f.writelines(new_file)


data = { "ip": IP, "port": 80 }
with open('config.json', 'w') as f:
    json.dump(data, f)