////alll the features of api

module.exports =  class  {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString
    }

    ///1. filtering
    filter() {
        //query filtering
        //1A.build query
        const queryObj = {
            ...this.queryString //destructuring and keeping it to new obj
        }

        ///now excluding some queries that we dont need
        const excludedFields = ['page', 'sort', 'limit', 'fields']
        excludedFields.forEach(el => delete queryObj[el]) //deleting unnecessary fields from queryObj

        // 1A. advanced filtering
        // the req.query looks like this:
        // {difficulty:"easy", duration:4} and when we use operators in our query like [gt,gte,lt,lte] then we should add $ sign infront of them
        //because that is the way of operating in mongoDB. look in mongoDB command to be clear
        //now lets add $ sign in the operators 
        let queryStr = JSON.stringify(queryObj) ///stringifying req.query so that we can replace words in it
        queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`) //using replace . where b helps so that the exact specified string will be replaced and g flag which is global helps so that all of them will be replaced 

        this.query = this.query.find(JSON.parse(queryStr))
        // console.log(this)
        return this;

    }



    // 2.sorting
    sort() {
        if (this.queryString.sort) {
            // query = query.sort(req.query.sort)
            //using sort is simple: sort=price then mongoose will automatically sort it in ascending with price and we can use sort=-price to descending.
            //we can also add other params in sorting
            let sortBy = this.queryString.sort.split(',').join(' ')
            this.query = this.query.sort(sortBy)

        } else {
            this.query = this.query.sort('-createdAt') //if user doesn't specifies the sort then sort them by the date of their creation. which means latest will come at first. we can do that by typing -createdAt
        }
        return this;

    }




    ///3. field limiting
    limiting() {
        // we should be able to get as minimum data as possible, so we limit field
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ')
            this.query = this.query.select(fields)
        } else {
            this.query = this.query.select('-__v')
        }
        // console.log(this)
        return this;

    }




    // 4. implementing pagination
    pagination() {
        ///in url we put page=2 and limit = 10 .. which means we need 10 results of page 2
        ///this means we need to skip 10 results and show 10 results which means page 2 with 10 results
        // query = query.skip(10).limit(10)
        const page = +this.queryString.page || 1 ///usetting default value using OR. if user doesnot defines page then use 1
        const limit = +this.queryString.limit || 10
        const skipValue = (page - 1) * limit
        this.query = this.query.skip(skipValue).limit(limit)

        return this;


    }


}

