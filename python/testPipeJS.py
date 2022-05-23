import os
import time

reqPipe = "./pipe_req"

rtn = True
try:
    print("Make "+ reqPipe)
    os.mkfifo(reqPipe)
except OSError as e:
    rtn = False
    print("Error while creating FIFO: {}".format(e))
    
fifo_req = os.open(reqPipe, os.O_WRONLY) 
print("Past os.open(reqPipe, os.O_WRONLY) ")    
 
while(1):
    os.write(fifo_req,"/home/nextgen01/HAB_WebServer/logs/imageSeq/image100GW_100.seq")
    os.write(fifo_req,"/home/nextgen01/HAB_WebServer/logs/imageSeq/image100GW_4.seq")
    #time.sleep(1)
    #os.write(fifo_req,"/home/nextgen01/HAB_WebServer/logs/imageSeq/image1GW_1.seq")
    #time.sleep(10)
    #os.write(fifo_req,"/home/nextgen01/imageFileManager/Logs/imageSeq/image5GW_3.seq")
    #os.write(fifo_req,"/home/nextgen01/imageFileManager/Logs/imageSeq/image6GW_1.seq")
    #os.write(fifo_req,"/home/nextgen01/imageFileManager/Logs/imageSeq/image4GW_1.seq")
    time.sleep(120)




    
    
