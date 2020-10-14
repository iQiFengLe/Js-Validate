/**
 * Created by WebStorm.
 * @Author: 芒果
 * @Time: 2020/10/14 13:28
 * @Email: m.zxt@foxmail.com
 */

/**
 * 验证器
 * Class
 */
class Validate {
    constructor () {
        this._message = {};
        this._rule = {};
        this._regx = {
            mobile: '^[1][3,4,5,7,8][0-9]{9}$',
            email: '^[a-z0-9]+([._\\\\-]*[a-z0-9])*@([a-z0-9]+[-a-z0-9]*[a-z0-9]+.){1,63}[a-z0-9]+$'
        };
        this._error = {};
        this._type = {};
        this._batch = true;
        this._alias = {
            '>=' : 'egt',
            '>'  : 'gt',
            '='  : 'eq',
            '<'  : 'lt',
            '<=' : 'lte',
            '!=' : 'unequal',
            '<>' : 'unequal'
        };
    }

    /**
     * 是否批量验证
     * @param {Boolean} is
     * @returns {this}
     */
    batch(is){

        this._batch = is;
        return this;
    }
    /**
     * 添加正则规则
     * @param data  规则名称或对象
     * @param val 正则表达式
     * @returns {this}
     */
    regx(data,val){
        if (!val){
            Object.assign(this._regx,data);
        }else{
            this._regx[data] = val;
        }
        return this;
    }
    /**
     * 附加验证规则
     * @param data 规则名称或对象
     * @param {Function|null|undefined} val
     * @returns {this}
     */
    type(data,val){
        if (!val){
            Object.assign(this._type,data);
        }else{
            this._type[data] = val;
        }
        return this;
    }

    /**
     * 添加字段提示文本
     * @param {Object|string} data 字段名称或者字段提示文本对象
     * @param val
     * @returns {this}
     */
    message(data,val){
        if (!val){
            Object.assign(this._message,data);
        }else{
            this._message[data] = val;
        }
        return this;
    };

    /**
     * 添加字段验证规则
     * @param {Object|string} rule 字段名称或者规则数组
     * @param val 验证规则
     * @returns {this}
     */
    rule(rule,val){

        if (!val){
            Object.assign(this._rule,rule);
        }else{
            this._rule[rule] = val;
        }
        return this;
    };

    /**
     * 验证
     * @param data
     * @param rules
     * @returns {boolean}
     */
    check(data,rules){

        if (!rules){
            rules = this._rule;
        }
        for (let key in rules){

            if (!rules.hasOwnProperty(key)) continue;

            let rule = rules[key];
            let value = this.getInputData(key,data);

            let result;

            if (rules instanceof Function){
                result = rules(value,rule,data);
            }else{
                result = this.checkItem(key,value,rule,data);
            }
            if (result !== true){
                if (this._batch){
                    this._error[key] = result;
                }else{
                    this._error = result;
                    return false;
                }
            }
        }
        return this.empty(this._error);
    }
    /**
     * 获取错误信息
     * @returns {{}}
     */
    getError(){
        return this._error;
    }
    /**
     * 清理
     */
    clear(){
        this._error = {};
        this._batch = true;
        this._message = {};
        this._rule = {};
        this._type = {};
    }

    /**
     * 验证项
     * @param field
     * @param value
     * @param rules
     * @param data
     * @returns {boolean|string|*}
     */
    checkItem(field,value,rules,data){

        if (typeof rules === 'string'){
            rules = rules.split('|');
        }
        for (let key in rules){
            if (!rules.hasOwnProperty(key)) continue;
            let rule = rules[key],
                result,
                info = key instanceof Number ? '' : key;
            if (rule instanceof Function){
                result = rule(value,field,data);

            }else{
                let tmp = this.getValidateType(key,rule);
                info = tmp[2];
                rule = tmp[1];
                let type = tmp[0];
                if (info === 'has' || 'require' === info || (value !== null && '' !== value)) {
                    result = this[type](value,rule,data,field);
                } else {
                    result = true;
                }
            }
            if (!result){
                return this.__getMsg(field,info);
            }
        }
        return true;
    }

    /**
     * 获取验证类型
     * @param key
     * @param rule
     * @returns {[*, string, *|string]|[Number, *, Number]}
     */
    getValidateType(key,rule){

        if (key instanceof Number){
            // 别名
            if (this._alias[key]){
                key = this._alias[key];
            }
            return [key,rule,key];
        }
        let type,info;
        if (rule.indexOf(':') > 0){
            let tmp = rule.split(':',2);
            type = tmp[0];
            if (this._alias[type])
                type = this._alias[type];
            info = type;
            rule = tmp[1];
        }else if(this[rule] && this[rule] instanceof Function){
            type = rule;
            info = rule;
            rule  = '';
        }else{
            type = 'is';
            info = rule;
        }
        return [type,rule,info]
    }

    /**
     * 获取数据
     * @param {String|number} key 键 支持 . 语法
     * @param data 数据源
     * @returns {null|*}
     * @private
     */
    getInputData(key,data){
        key = key.toString();
        if(key.indexOf('.') < 1){
            return data[key] ? data[key] :  null;
        }
        let name = key.split('.');
        for (let i=0;i < name.length;i++){
            if (data[name[i]] !== undefined && data[name[i]] !== null){
                data = data[name[i]];
            }else{
                return null;
            }
        }
        return data;
    }

    /**
     * 获取错误信息
     * @param field
     * @param rule
     * @returns {string|*}
     */
    __getMsg(field,rule){

        for (let k in this._message){
            if (!this._message.hasOwnProperty(k)) continue;
            let tmp = (k+'').split(',');
            if (this.inArray(tmp,field) || this.inArray(tmp,field + '.' + rule)){
                return this._message[k];
            }
        }
        return rule + ' ' + field;
    }

    /**
     * @param value 字段值
     * @param rule 验证规则
     * @param {Object} data 数据
     * @param {String} field 字段
     * @returns {boolean|(function(*): boolean)}
     */
    is(value,rule,data,field){

        let result;
        switch (rule){
            case 'require':
                // 必须
                result = value === 0 || !this.empty(value);
                break;
            case 'has':
                // 存在
                result = this.getInputData(field,data) !== null;
                break;
            case 'accepted':
                // 接受
                result = this.inArray(['1', 'on', 'yes',1],value,true);
                break;
            case 'boolean':
            case 'bool':
                // 是否为布尔值
                result = this.inArray([true, false, 0, 1, '0', '1'],value,true);
                break;
            case 'number':
                result = /^([-|+]?\d+|[-|+]?\d+\.\d+)$/.test(value + '');
                break;
            case 'alpha':
                result = !/^[^a-zA-z]$/.test(value);
                break;
            case 'alphaNum':
                result = !/^[^a-zA-z0-9]$/.test(value);
                break;
            case 'chs':
                // 纯汉字
                result = /^[\u4E00-\u9FA5]+$/.test(value);
                break;
            case 'chsAlpha':
                // 汉字或字母或汉字+字母
                result = !/[^\u4E00-\u9FA5a-zA-z]/.test(value);
                break;
            case 'chsAlphaNum':
                // 汉字或字母或数字或汉字+字母+数字
                result = !/[^\u4E00-\u9FA5a-zA-z0-9]/.test(value);
                break;
            case 'array':
                // 是否为数组
                result = '[object array]' === Object.prototype.toString.call(value).toLocaleLowerCase();
                break;
            case 'object':
                // 是否为对象
                result = '[object object]' === Object.prototype.toString.call(value).toLocaleLowerCase()
                break;
            case 'func':
            case 'function':
                // 是否为函数
                result = '[object function]' === Object.prototype.toString.call(value).toLocaleLowerCase()
                break;
            case 'int':
                // 整型
                result = /^[-|+]?\d+$/.test(value);
                break;
            case 'float':
                // 浮点
                result = /^[-|+]?\d+\.\d+$/.test(value);
                break;
            default:
                switch (true) {
                    case rule instanceof Function:
                        result = rule(value,rule,data,field);
                        break;
                    case this[rule] instanceof Function:
                        result = this[rule](value,rule,data,field);
                        break;
                    case this._regx[rule] !== undefined:
                        result = typeof this._regx[rule] === 'string' ? new RegExp(this._regx[rule]).test(value) : this._regx[rule].test(value);
                        break;
                    case this._type[rule] !== undefined:
                        result = this._type[rule](value,rule,data,field);
                        break;
                    default:
                        throw new Error(`validate rule not exits: ${rule}`);
                }
                break;
        }
        return result;
    }

    /**
     * 检测是否为空
     * @param param 如下皆为空 {},[],0,'',false,null,undefined
     * @returns {boolean}
     */
    empty(param){

        // 是否为 undefined
        if (typeof param ===  'undefined'){
            return true;
        }

        // 是否为空字符串
        if (typeof param === 'string' && param.trim() === ''){
            return true;
        }


        // 是否为假
        if (param === false){
            return true;
        }

        // 是否为空数组
        if (param instanceof Array && param.length === 0){
            return true;
        }

        // 是否为 null
        if (param ===  null){
            return true;
        }

        // 是否为0
        if (typeof param === 'number' && parseInt(param) === 0 && /\./.test(param.toString()) === false){
            return true;
        }

        // 是否为空对象
        return param instanceof Object && JSON.stringify (param) === '{}';

    }

    /**
     * 判断值是否在数组中存在
     * @param arr
     * @param e
     * @param t   是否强类型
     * @returns {boolean}
     */
    inArray(arr,e,t){
        for (let k in arr)
            if (t){
                if (arr[k] === e) return true;
            }else{
                if (arr[k] == e) return true;
            }
        return false;
    }

    /**
     * 大于等于
     * @param value
     * @param rule
     * @param data
     * @returns {boolean}
     */
    egt(value,rule,data){
        return value >= this.getInputData(data,rule);
    }
    /**
     * 大于
     * @param value
     * @param rule
     * @param data
     * @returns {boolean}
     */
    gt(value,rule,data){
        return value > this.getInputData(data,rule);
    }
    /**
     * 等于
     * @param value
     * @param rule
     * @param data
     * @returns {boolean}
     */
    eq(value,rule,data){
        return value == this.getInputData(data,rule);
    }
    /**
     * 小于
     * @param value
     * @param rule
     * @param data
     * @returns {boolean}
     */
    lt(value,rule,data){
        return value < this.getInputData(data,rule);
    }
    /**
     * 小于等于
     * @param value
     * @param rule
     * @param data
     * @returns {boolean}
     */
    lte(value,rule,data){
        return value <= this.getInputData(data,rule);
    }

    /**
     * 不等于
     * @param value
     * @param rule
     * @param data
     * @returns {boolean}
     */
    unequal(value,rule,data){
        return value != this.getInputData(data,rule);
    }

    /**
     * 验证是否在范围内
     * @param value
     * @param rule
     * @returns {boolean}
     */
    in(value,rule){
        return rule instanceof Array ? this.inArray(rule,value) : this.inArray(rule.split(','),value);
    }
    /**
     * 验证是否不在范围内
     * @param value
     * @param rule
     * @returns {boolean}
     */
    notIn(value,rule){
        return !(rule instanceof Array ? this.inArray(rule,value) : this.inArray(rule.split(','),value));
    }

    /**
     * IPv6验证
     * @param value
     * @returns {*}
     */
    ipv6(value){
        return /:/.test(value) &&
        value.match(/:/g).length < 8 &&
        /::/.test(value) ?
            (value.match(/::/g).length === 1 && /^::$|^(::)?([\da-f]{1,4}(:|::))*[\da-f]{1,4}(:|::)?$/i.test(value))
            : /^([\da-f]{1,4}:){7}[\da-f]{1,4}$/i.test(value);
    }

    /**
     * IPv4验证
     * @param value
     * @returns {boolean}
     */
    ipv4(value){
        return /^(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])\.(\d{1,2}|1\d\d|2[0-4]\d|25[0-5])$/.test(value);
    }

    /**
     * 验证IP 支持 ipv4、ipv6
     * @param value
     * @returns {boolean}
     */
    ip(value){
        return this.ipv4(value) || this.ipv6(value);
    }

    /**
     * 数据长度验证
     * @param {String|Array|Object|Number} value
     * @param rule
     * @returns {boolean}
     */
    length(value,rule){
        let len = this.getDataLength(value);
        if (typeof rule === 'string' && rule.indexOf(',') > 0){
            let tmp = rule.split(',',2);
            return len >= tmp[0] && len <= tmp[1];
        }
        return value == len;
    }

    /**
     * 范围
     * @param {String|Array|Object|Number} value
     * @param rule
     * @returns {boolean|boolean}
     */
    between(value,rule){
        let len = this.getDataLength(value);
        if (typeof rule != 'string' || rule.indexOf(',') == -1){
            console.warn('Warning: Validate between rule error');
            return false;
        }
        let tmp = rule.split(',',2);
        return len >= tmp[0] && len <= tmp[1];
    }

    /**
     * 最大值验证
     * @param {Number} value
     * @param rule
     * @returns {boolean}
     */
    max(value,rule){
        let ruleVal = this.strToNumber(rule);

        if (ruleVal === false){
            console.warn('Warning: Validate max rule value expect number given ' + this.getDataType(rule))
            return false;
        }
        if (this.strToNumber(value) === false)
            value = this.getDataLength(value);

        return value <= ruleVal;
    }

    /**
     * 最小值验证
     * @param {Number} value
     * @param rule
     * @returns {boolean}
     */
    min(value,rule){
        let ruleVal = this.strToNumber(rule);
        if (ruleVal === false){
            console.warn('Warning: Validate min rule value expect number given ' + this.getDataType(rule))
        }
        if (this.strToNumber(value) === false)
            value = this.getDataLength(value);
        return value >= ruleVal;
    }

    /**
     * 字符串转Number 转换失败返回 false
     * @param str
     * @returns {boolean|number}
     */
    strToNumber(str){
        let type = this.getDataType(str);
        if (type !== 'string' && type !== 'number')
            return false;
        let val = Number(str);
        if (val + '' === 'NaN'){
            return false;
        }
        return val;
    }
    /**
     * 获取数据类型
     * @param value
     * @returns {string}
     */
    getDataType(value){
        let type = Object.prototype.toString.call(value).toLocaleLowerCase();
        return type.replace(/[\[\]]/g,'').split(' ')[1];
    }

    /**
     * 获取数据长度
     * @param {String|Array|Object|Number} value 如果传递数字那么将认为长度就等于该数字
     * @returns {number}
     */
    getDataLength(value){
        let len = 0;
        let type = this.getDataType(value);
        switch (type) {
            case 'object':
            case 'array':
                for(let k in value)
                    if(value.hasOwnProperty(k)) len++;
                break;
            case 'string':
                len = value.length;
                break;
            case 'number':
                len = value;
                break;
            default:
                console.warn('Warning: Validate get data length function params 1 data type not support: ' + type);
                break;
        }
        return len;
    }
}

export default Validate;