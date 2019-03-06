import web3

class networkException(Exception):
    def __init__(self, value):
        self.value = value

    def __repr__(self):
        return repr(self.value)


class network(object):
    def __init__(self, provider):
        self.w3 = web3.Web3(web3.Web3.HTTPProvider(provider))

    def get_last_block_number(self):
        try:
            return self.w3.eth.blockNumber
        except Exception as e:
            raise networkException(str(e))
    
    def get_block(self, block):
        try:
            return self.w3.eth.getBlock(block)
        except Exception as e:
            raise networkException(str(e))
    
    def get_transaction_receipt(self, tx_hash):
        try:
            return self.w3.eth.getTransactionReceipt(tx_hash)
        except Exception as e:
            raise networkException(str(e))

    def get_transaction(self, tx_hash):
        try:
            ret = self.w3.eth.getTransaction(tx_hash)
            return ret
        except Exception as e:
            raise networkException(str(e))
