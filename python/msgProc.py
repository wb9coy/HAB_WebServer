import time
import Queue
import threading
import os
class pipeMsgProc():
    """ Implements the threading.Thread interface (start, join, etc.) and
        can be controlled via the cmd_q Queue attribute. Replies are placed in
        the reply_q Queue attribute.
    """
    
    def __init__(self,
                 reqPipe,
                 debug=False):
        
        self.reqQueue         = Queue.Queue()
        self.alive            = threading.Event()
        self.alive.set()
        self.reqThread        = None
        self.reqPipe          = reqPipe
        self.debug            = debug
        self.fifo_req         = None
        
    def join(self, timeout=None):
        threading.Thread.join(self.reqThread, timeout)
        
    def START(self):
        
        rtn = True
        
        self.reqThread = threading.Thread(target=self.pipeRxThreadFunction)
        self.reqThread.start()
        time.sleep(1)
        
        return rtn 
    
    def MKREQFIFO(self):
        rtn = True
        try:
            print("Make "+ self.reqPipe)
            os.mkfifo(self.reqPipe)
        except OSError as e:
            rtn = False
            print("Error while creating FIFO: {}".format(e))
		
        return rtn
	        
    def CONNECT(self):
        rtn = True

        try:
            print("Connecting to " + self.reqPipe)
            self.fifo_req = os.open(self.reqPipe, os.O_RDONLY)
            print('Req pipe ready')
                    
        except Exception as e:
            print(str(e))
            return False
        
        return rtn

    def CLOSE(self):
        print("***** Closing  ****")
        self.fifo_req.close()
        self.alive.clear()
                
    def REQ(self):
        try:
            REQmsg = self.reqQueue.get(True)
            return REQmsg
        except Exception as e:
            print(str(e))
            return None
        
    def pipeRxThreadFunction(self):
        print("**** STARTING  pipeRx Thread ******")
        
        while self.alive.isSet():
            try:  
                pipeRxThreadMsgByte = os.read(self.fifo_req,1024)
                pipeRxThreadMsg = pipeRxThreadMsgByte.decode("utf-8")
                self.reqQueue.put(pipeRxThreadMsg)              
            except Exception as e:
                print(str(e))  