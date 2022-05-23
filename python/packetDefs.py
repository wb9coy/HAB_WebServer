import ctypes

c_uint32 = ctypes.c_uint32
c_uint16 = ctypes.c_uint16
c_uint8 = ctypes.c_uint8

MAX_BYTES           = 56

class HABPacketImageSeqStart(ctypes.LittleEndianStructure):
    name     = "HABPacketImageSeqStart"
    _pack_   = 1
    _fields_ = [
        ("packetType",         c_uint16),
        ("imageFileID",        c_uint8),
        ("gwID",               c_uint8),
        ("fileSize",           c_uint32)
        ]

class HABPacketImageSeqData(ctypes.LittleEndianStructure):
    name     = "HABPacketImageSeqData"
    _pack_   = 1
    _fields_ = [
        ("packetType",         c_uint16),
        ("imageFileID",        c_uint8),
        ("imageSeqNum",        c_uint16),
        ("imageDataLen",       c_uint8),
        ("gwID",               c_uint8),
        ("imageData",          c_uint8*MAX_BYTES)
        ]