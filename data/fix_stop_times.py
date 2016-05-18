# transform this
#   12437968,15:19:01,15:19:01,31811,2,'',0,0,0.0,1
# into this
# 12437968,"15:19:01","15:19:01",31811,2,"",0,0,0.0,1

infile = file("stop_times_noheader_tobefixed.txt", 'r')
outfile = file("stop_times_noheader.txt", 'w')

for line in infile:
    fields = line.split(",")
    fields[1] = '"' + fields[1] + '"'
    fields[2] = '"' + fields[2] + '"'
    outLine = ",".join(fields)
    outLine.replace("'", '"')
    outfile.write(outLine)

outfile.close()
infile.close()
