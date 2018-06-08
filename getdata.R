# Loading the required packages. Use install.package("package") if any is missing.
library(httr);library(jsonlite);library(rjson);library(dplyr);library(reshape2);library(plyr)

# GET the data from the server ----------------
a=GET("https://kintohrk.herokuapp.com/v1/buckets/apps/collections/infrs/records", 
      authenticate("khrkadmin", "khrkpass"))
rawdat=content(a)

# Back up the original data in json format
write(rjson::toJSON(rawdat), file="jsondata.JSON")
# To read in the original json file, use:
# rawdat <- rjson::fromJSON(file="jsondata.JSON")

# PARSE the json file to a data frame ---------
dat <- rawdat$data
data = data.frame()
for(k in seq (1:length(dat))) {
  datp = data.frame()
  for (i in seq(1:length(dat[[k]]$datp))){
    datp = plyr::rbind.fill(datp,cbind(id=dat[[k]]$id[i],jsonlite::fromJSON(dat[[k]]$datp[i])))
  }
  datt = data.frame()
  for (i in seq(1:length(dat[[k]]$datt))){
    datt = plyr::rbind.fill(datt,cbind(id=dat[[k]]$id[i],jsonlite::fromJSON(dat[[k]]$datt[i])))
  }
  colnames(datt) <- paste("T", colnames(datt), sep = "_")
  data = plyr::rbind.fill(data,merge(datp,datt,by.x="id",by.y="T_id"))
}

# STORE the data ------------------------------
# 'mydata' can be any name
# saves the file in your working directory (getwd()). To save elsewhere, provide path in the filename, e.g., "C://files/mydata.csv"

# Store as R data frame (lists remain intact)
saveRDS(data, file="mydata.rds")
# To read back in:
# data <- readRDS("mydata.rds")

# Store as csv (transforming the list and vector values to strings)
data$T_CUES=as.character(data$T_CUES)
data$T_iiprobes=as.character(data$T_iiprobes)
write.csv(data,"C://42/mydata.csv")

#DELETE('http://kintohrk.herokuapp.com/v1/buckets/apps/collections/infrs/records', config=authenticate('khrkadmin', 'khrkpass'))

