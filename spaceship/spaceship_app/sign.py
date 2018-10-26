from web3.auto import w3
from eth_account.messages import defunct_hash_message

def _ecRecover(msg, sign):
    message_hash = defunct_hash_message(text=msg)
    return w3.eth.account.recoverHash(message_hash, signature=sign).lower()



