import web3


def calc_function_hash(function):
    f = "%s(" % function['name']
    for input in function['inputs']:
        f = "%s%s," % (f, input['type'])
    f = f[:-1] + ')'    
    hash = web3.Web3.sha3(f.encode()).hex()
    return hash[0:10]